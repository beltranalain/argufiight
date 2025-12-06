import { createResendClient } from './resend'

/**
 * Send approval email to advertiser
 */
export async function sendAdvertiserApprovalEmail(
  advertiserEmail: string,
  advertiserName: string,
  companyName: string
): Promise<boolean> {
  try {
    const resend = await createResendClient()
    if (!resend) {
      console.warn('Resend client not available, skipping email notification')
      return false
    }

    const dashboardUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://www.argufight.com'}/advertiser/dashboard`
    const loginUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://www.argufight.com'}/login`

    const result = await resend.emails.send({
      from: 'Argu Fight <noreply@argufight.com>',
      to: advertiserEmail,
      subject: 'Your Advertiser Application Has Been Approved!',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Advertiser Application Approved</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0;">🎉 Application Approved!</h1>
          </div>
          
          <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
            <p>Hi ${advertiserName},</p>
            
            <p>Great news! Your advertiser application for <strong>${companyName}</strong> has been approved.</p>
            
            <p>You can now access your advertiser dashboard to:</p>
            <ul>
              <li>Create and manage advertising campaigns</li>
              <li>Connect your Stripe account for payments</li>
              <li>Discover and sponsor creators</li>
              <li>Track your campaign performance</li>
            </ul>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${dashboardUrl}" style="display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">
                Access Dashboard
              </a>
            </div>
            
            <p style="font-size: 14px; color: #666;">
              If you haven't already, you'll need to <a href="${loginUrl}" style="color: #667eea;">sign in</a> using the email address you provided: <strong>${advertiserEmail}</strong>
            </p>
            
            <p style="font-size: 14px; color: #666; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd;">
              If you have any questions, please contact our support team.
            </p>
            
            <p style="margin-top: 20px;">
              Best regards,<br>
              The Argu Fight Team
            </p>
          </div>
        </body>
        </html>
      `,
    })

    if (result.error) {
      console.error('Failed to send advertiser approval email:', result.error)
      return false
    }

    console.log(`✅ Approval email sent to ${advertiserEmail}`)
    return true
  } catch (error: any) {
    console.error('Error sending advertiser approval email:', error)
    return false
  }
}

/**
 * Send rejection email to advertiser
 */
export async function sendAdvertiserRejectionEmail(
  advertiserEmail: string,
  advertiserName: string,
  companyName: string,
  reason?: string
): Promise<boolean> {
  try {
    const resend = await createResendClient()
    if (!resend) {
      console.warn('Resend client not available, skipping email notification')
      return false
    }

    const result = await resend.emails.send({
      from: 'Argu Fight <noreply@argufight.com>',
      to: advertiserEmail,
      subject: 'Update on Your Advertiser Application',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Advertiser Application Update</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: #f9f9f9; padding: 30px; border-radius: 10px;">
            <p>Hi ${advertiserName},</p>
            
            <p>Thank you for your interest in advertising with Argu Fight.</p>
            
            <p>Unfortunately, we are unable to approve your advertiser application for <strong>${companyName}</strong> at this time.</p>
            
            ${reason ? `
              <div style="background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0;">
                <p style="margin: 0;"><strong>Reason:</strong> ${reason}</p>
              </div>
            ` : ''}
            
            <p>If you have any questions or would like to discuss this decision, please contact our support team.</p>
            
            <p style="margin-top: 30px;">
              Best regards,<br>
              The Argu Fight Team
            </p>
          </div>
        </body>
        </html>
      `,
    })

    if (result.error) {
      console.error('Failed to send advertiser rejection email:', result.error)
      return false
    }

    console.log(`✅ Rejection email sent to ${advertiserEmail}`)
    return true
  } catch (error: any) {
    console.error('Error sending advertiser rejection email:', error)
    return false
  }
}

