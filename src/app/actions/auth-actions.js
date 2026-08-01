'use server';

import { getAdminSupabase } from '../../lib/supabase/admin.js';
import { resend, SENDER_EMAIL } from '../../lib/resend.js';
import { getConfirmationEmailHtml, getPasswordResetEmailHtml } from '../../lib/email-templates.js';

/**
 * Custom Signup Server Action:
 * 1. Generates Supabase confirmation link (Without sending default Supabase email)
 * 2. Creates customer profile entry in Supabase `profiles` table (including email & role)
 * 3. Sends branded KEMET confirmation email directly via Resend API from noreply@kemetmisr.com
 */
export async function customSignupAction({ email, password, fullName, phone = '', governorate = 'القاهرة' }) {
  try {
    const supabaseAdmin = getAdminSupabase();
    const cleanEmail = email.trim().toLowerCase();
    const cleanName = fullName.trim();
    const cleanPhone = phone.trim() ? phone.trim() : null;
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://kemetmisr.com';
    const redirectUrl = `${siteUrl}/auth/callback`;

    // 1. Generate Supabase Signup Confirmation Link (does NOT trigger default Supabase email)
    const { data: linkData, error: linkErr } = await supabaseAdmin.auth.admin.generateLink({
      type: 'signup',
      email: cleanEmail,
      password: password,
      options: {
        data: {
          full_name: cleanName,
          phone: cleanPhone,
          governorate: governorate
        },
        redirectTo: redirectUrl
      }
    });

    if (linkErr) {
      console.error('generateLink error:', linkErr);
      return {
        success: false,
        error: linkErr.message || 'فشل في إنشاء حساب المستخدم'
      };
    }

    const user = linkData.user;
    const properties = linkData.properties;
    
    // Construct robust confirmation URL using action_link or token_hash
    let confirmationUrl = properties?.action_link;
    if (!confirmationUrl && properties?.hashed_token) {
      confirmationUrl = `${redirectUrl}?token_hash=${properties.hashed_token}&type=signup&next=/my-orders`;
    }

    if (!confirmationUrl) {
      confirmationUrl = `${siteUrl}/login?confirmed=true`;
    }

    // 2. Upsert Customer Profile in Supabase profiles table
    if (user?.id) {
      const { error: profileErr } = await supabaseAdmin.from('profiles').upsert({
        id: user.id,
        email: cleanEmail,
        full_name: cleanName,
        phone: cleanPhone,
        governorate: governorate,
        role: 'customer'
      }, { onConflict: 'id' });

      if (profileErr) {
        console.warn('Profile upsert warning:', profileErr.message);
      }
    }

    // 3. Send 100% Branded KEMET Email via Resend from noreply@kemetmisr.com
    let emailSent = false;
    try {
      const emailHtml = getConfirmationEmailHtml({
        confirmationUrl: confirmationUrl,
        fullName: cleanName
      });

      const { data: resendData, error: resendErr } = await resend.emails.send({
        from: SENDER_EMAIL,
        to: [cleanEmail],
        subject: 'تأكيد وتفعيل حسابك في KEMET 🚀',
        html: emailHtml
      });

      if (resendErr) {
        console.error('Resend email error:', resendErr);
      } else {
        console.log('Resend email sent successfully:', resendData);
        emailSent = true;
      }
    } catch (eErr) {
      console.error('Email sending exception:', eErr);
    }

    return {
      success: true,
      emailSent,
      message: 'تم إنشاء الحساب وإرسال بريد التفعيل من KEMET بنجاح 📩'
    };
  } catch (err) {
    console.error('customSignupAction error:', err);
    return {
      success: false,
      error: err.message || 'حدث خطأ في عملية إنشاء الحساب'
    };
  }
}

/**
 * Custom Password Reset Action via Resend & Supabase
 */
export async function customPasswordResetAction(email) {
  try {
    const supabaseAdmin = getAdminSupabase();
    const cleanEmail = email.trim().toLowerCase();
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://kemetmisr.com';
    const redirectUrl = `${siteUrl}/auth/callback?type=recovery`;

    const { data: linkData, error: linkErr } = await supabaseAdmin.auth.admin.generateLink({
      type: 'recovery',
      email: cleanEmail,
      options: {
        redirectTo: redirectUrl
      }
    });

    if (linkErr) throw linkErr;

    const resetUrl = linkData.properties?.action_link || `${siteUrl}/login`;
    const emailHtml = getPasswordResetEmailHtml({ resetUrl });

    const { error: resendErr } = await resend.emails.send({
      from: SENDER_EMAIL,
      to: [cleanEmail],
      subject: 'إعادة تعيين كلمة المرور - KEMET 🔑',
      html: emailHtml
    });

    if (resendErr) throw resendErr;

    return { success: true, message: 'تم إرسال رابط إعادة تعيين كلمة المرور بنجاح 📩' };
  } catch (err) {
    console.error('customPasswordResetAction error:', err);
    return { success: false, error: err.message || 'فشل إرسال بريد استعادة كلمة المرور' };
  }
}
