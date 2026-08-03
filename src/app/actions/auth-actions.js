'use server';

import React from 'react';
import { render } from '@react-email/render';
import { getAdminSupabase } from '../../lib/supabase/admin.js';
import { getResendClient, SENDER_EMAIL } from '../../lib/resend.js';
import { OtpVerificationEmail, PasswordResetEmail } from '../../emails/index.js';

/**
 * Clean Error Formatter strictly complying with KEMET Digital Brand Guidelines
 * Translates technical error messages into calm, concise Arabic text without leaking stack traces or technical details.
 */
function formatKemetError(err, defaultMsg = 'تعذر تنفيذ العملية. يرجى المحاولة مرة أخرى.') {
  if (!err) return defaultMsg;
  const msg = typeof err === 'string' ? err : err.message || '';

  if (msg.includes('already been registered') || msg.includes('email_exists')) {
    return 'البريد الإلكتروني مسجل بالفعل.';
  }
  if (msg.includes('invalid') || msg.includes('expired') || msg.includes('Token')) {
    return 'رمز التحقق غير صحيح أو انتهت صلاحيته.';
  }
  if (msg.includes('rate limit') || msg.includes('Rate limit exceeded')) {
    return 'تم تجاوز عدد المحاولات المسموح بها. يرجى المحاولة بعد قليل.';
  }
  return defaultMsg;
}

/**
 * 1. customSignupAction: Generates 6-Digit Email OTP via Supabase Auth & Sends via Resend
 * - Standard Supabase Auth API: auth.admin.generateLink({ type: 'signup' })
 * - Security-Neutral handling for existing emails (no email enumeration leakage)
 */
export async function customSignupAction({ email, password, fullName, phone = '', governorate = 'القاهرة' }) {
  try {
    const supabaseAdmin = getAdminSupabase();

    const cleanEmail = email.trim().toLowerCase();
    const cleanName = fullName.trim();
    const cleanPhone = phone.trim() ? phone.trim() : null;

    // 1. Generate Supabase Signup Link & 6-Digit OTP
    const { data: linkData, error: linkErr } = await supabaseAdmin.auth.admin.generateLink({
      type: 'signup',
      email: cleanEmail,
      password: password,
      options: {
        data: {
          full_name: cleanName,
          phone: cleanPhone,
          governorate: governorate
        }
      }
    });

    let otpCode = linkData?.properties?.email_otp;
    let userId = linkData?.user?.id;

    // Security-Neutral Existing Email Handling
    if (linkErr) {
      if (linkErr.code === 'email_exists' || linkErr.message?.includes('already been registered')) {
        console.log('User exists. Generating fresh OTP for email verification...');
        const { data: magicData, error: magicErr } = await supabaseAdmin.auth.admin.generateLink({
          type: 'magiclink',
          email: cleanEmail
        });

        if (!magicErr && magicData?.properties?.email_otp) {
          otpCode = magicData.properties.email_otp;
        } else {
          // Return security neutral response
          return {
            success: true,
            emailSent: true,
            message: 'تم إرسال رمز التحقق إلى بريدك الإلكتروني.'
          };
        }
      } else {
        return {
          success: false,
          error: formatKemetError(linkErr)
        };
      }
    }

    // 2. Upsert Customer Profile in Supabase profiles table
    if (userId) {
      const { error: profileErr } = await supabaseAdmin.from('profiles').upsert({
        id: userId,
        email: cleanEmail,
        full_name: cleanName,
        phone: cleanPhone,
        governorate: governorate,
        role: 'customer'
      }, { onConflict: 'id' });

      if (profileErr) {
        console.warn('Profile upsert warning:', profileErr.message);
        if (profileErr.message?.includes('profiles_phone_key') || profileErr.message?.includes('phone')) {
          return {
            success: false,
            error: 'رقم الهاتف مستخدم بالفعل.'
          };
        }
      }
    }

    // 3. Send 6-Digit OTP Email via Resend using React Email Template
    if (otpCode) {
      const resend = getResendClient();
      const emailHtml = await render(<OtpVerificationEmail otpCode={otpCode} />);

      const { data: resendData, error: resendErr } = await resend.emails.send({
        from: SENDER_EMAIL,
        to: [cleanEmail],
        subject: 'رمز تفعيل حساب KEMET',
        html: emailHtml
      });

      if (resendErr) {
        console.error('Resend API error:', resendErr);
        return {
          success: false,
          error: 'تعذر إرسال البريد الإلكتروني. يرجى المحاولة مرة أخرى.'
        };
      }
    }

    return {
      success: true,
      emailSent: true,
      message: 'تم إرسال رمز التحقق إلى بريدك الإلكتروني.'
    };
  } catch (err) {
    console.error('customSignupAction main error:', err);
    return {
      success: false,
      error: formatKemetError(err)
    };
  }
}

/**
 * 2. verifySignupOtpAction: Verifies 6-Digit OTP using Official Supabase verifyOtp API
 * - Standard Supabase Auth API: auth.verifyOtp({ email, token, type: 'signup' })
 * - Returns session data upon successful verification
 */
export async function verifySignupOtpAction({ email, otp }) {
  try {
    const supabaseAdmin = getAdminSupabase();
    const cleanEmail = email.trim().toLowerCase();
    const cleanOtp = otp.trim();

    // Verify OTP via Supabase Auth
    const { data, error } = await supabaseAdmin.auth.verifyOtp({
      email: cleanEmail,
      token: cleanOtp,
      type: 'signup'
    });

    if (error) {
      // Fallback try with type 'email'
      const { data: retryData, error: retryErr } = await supabaseAdmin.auth.verifyOtp({
        email: cleanEmail,
        token: cleanOtp,
        type: 'email'
      });

      if (retryErr) {
        return {
          success: false,
          error: 'رمز التحقق غير صحيح أو انتهت صلاحيته.'
        };
      }

      return {
        success: true,
        session: retryData.session,
        user: retryData.user,
        message: 'تم التحقق من البريد الإلكتروني بنجاح.'
      };
    }

    return {
      success: true,
      session: data.session,
      user: data.user,
      message: 'تم التحقق من البريد الإلكتروني بنجاح.'
    };
  } catch (err) {
    console.error('verifySignupOtpAction error:', err);
    return {
      success: false,
      error: 'رمز التحقق غير صحيح أو انتهت صلاحيته.'
    };
  }
}

/**
 * 3. resendOtpAction: Generates a Fresh 6-Digit OTP and Resends Email via Resend
 * - Standard Supabase Auth API: auth.admin.generateLink({ type: 'magiclink' })
 */
export async function resendOtpAction({ email }) {
  try {
    const supabaseAdmin = getAdminSupabase();
    const cleanEmail = email.trim().toLowerCase();

    const { data, error } = await supabaseAdmin.auth.admin.generateLink({
      type: 'magiclink',
      email: cleanEmail
    });

    if (error) {
      return {
        success: false,
        error: formatKemetError(error)
      };
    }

    const otpCode = data?.properties?.email_otp;
    if (otpCode) {
      const resend = getResendClient();
      const emailHtml = await render(<OtpVerificationEmail otpCode={otpCode} />);

      const { error: resendErr } = await resend.emails.send({
        from: SENDER_EMAIL,
        to: [cleanEmail],
        subject: 'رمز تفعيل حساب KEMET الجديد',
        html: emailHtml
      });

      if (resendErr) {
        console.error('resendOtpAction Resend error:', resendErr);
        return {
          success: false,
          error: 'تعذر إرسال البريد الإلكتروني. يرجى المحاولة مرة أخرى.'
        };
      }
    }

    return {
      success: true,
      message: 'تم إرسال رمز تحقق جديد إلى بريدك الإلكتروني.'
    };
  } catch (err) {
    console.error('resendOtpAction error:', err);
    return {
      success: false,
      error: formatKemetError(err)
    };
  }
}

/**
 * 4. forgotPasswordOtpAction: Generates Password Recovery 6-Digit OTP via Supabase Auth & Resend
 * - Standard Supabase Auth API: auth.admin.generateLink({ type: 'recovery' })
 */
export async function forgotPasswordOtpAction(email) {
  try {
    const supabaseAdmin = getAdminSupabase();
    const cleanEmail = email.trim().toLowerCase();

    const { data, error } = await supabaseAdmin.auth.admin.generateLink({
      type: 'recovery',
      email: cleanEmail
    });

    if (error) {
      // Security-Neutral Handling
      return {
        success: true,
        message: 'تم إرسال رمز استعادة كلمة المرور إلى بريدك الإلكتروني.'
      };
    }

    const otpCode = data?.properties?.email_otp;
    if (otpCode) {
      const resend = getResendClient();
      const emailHtml = await render(<PasswordResetEmail otpCode={otpCode} />);

      const { error: resendErr } = await resend.emails.send({
        from: SENDER_EMAIL,
        to: [cleanEmail],
        subject: 'رمز استعادة كلمة المرور - KEMET',
        html: emailHtml
      });

      if (resendErr) {
        console.error('Resend recovery error:', resendErr);
        return {
          success: false,
          error: 'تعذر إرسال البريد الإلكتروني. يرجى المحاولة مرة أخرى.'
        };
      }
    }

    return {
      success: true,
      message: 'تم إرسال رمز استعادة كلمة المرور إلى بريدك الإلكتروني.'
    };
  } catch (err) {
    console.error('forgotPasswordOtpAction error:', err);
    return {
      success: false,
      error: formatKemetError(err)
    };
  }
}

/**
 * 5. verifyPasswordResetOtpAction: Verifies Recovery OTP & Updates User Password
 * - Standard Supabase Auth API: auth.verifyOtp({ email, token, type: 'recovery' })
 * - Standard Supabase Auth API: auth.admin.updateUserById(userId, { password })
 */
export async function verifyPasswordResetOtpAction({ email, otp, newPassword }) {
  try {
    const supabaseAdmin = getAdminSupabase();
    const cleanEmail = email.trim().toLowerCase();
    const cleanOtp = otp.trim();

    // 1. Verify Recovery OTP
    const { data, error } = await supabaseAdmin.auth.verifyOtp({
      email: cleanEmail,
      token: cleanOtp,
      type: 'recovery'
    });

    if (error || !data?.user?.id) {
      return {
        success: false,
        error: 'رمز التحقق غير صحيح أو انتهت صلاحيته.'
      };
    }

    // 2. Update User Password in Supabase Auth
    const { error: updateErr } = await supabaseAdmin.auth.admin.updateUserById(data.user.id, {
      password: newPassword
    });

    if (updateErr) {
      return {
        success: false,
        error: formatKemetError(updateErr, 'تعذر تحديث كلمة المرور.')
      };
    }

    return {
      success: true,
      session: data.session,
      user: data.user,
      message: 'تم تحديث كلمة المرور بنجاح.'
    };
  } catch (err) {
    console.error('verifyPasswordResetOtpAction error:', err);
    return {
      success: false,
      error: 'رمز التحقق غير صحيح أو انتهت صلاحيته.'
    };
  }
}
