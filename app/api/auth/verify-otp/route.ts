import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";
import dbConnect from "@/lib/dbConnect";
import User from "@/models/User";

// Create transporter for sending emails
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || "587"),
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD,
    },
  });
};

// Generate 6-digit OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

export async function POST(request: NextRequest) {
  try {
    const { action, email, otp } = await request.json();

    await dbConnect();

    if (action === "send") {
      // Send OTP to email
      const user = await User.findOne({ email });
      if (!user) {
        return NextResponse.json(
          { success: false, error: "User not found" },
          { status: 404 }
        );
      }

      // Generate and save OTP
      const newOTP = generateOTP();
      const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

      await User.findOneAndUpdate(
        { email },
        { otp: newOTP, otpExpiry }
      );

      // Send email
      const transporter = createTransporter();
      
      const mailOptions = {
        from: process.env.SMTP_FROM,
        to: email,
        subject: "Synapse - Email Verification Code",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #333; text-align: center;">Welcome to Synapse!</h1>
            <p style="color: #666; font-size: 16px;">
              Please verify your email address by entering the following code:
            </p>
            <div style="background: #f5f5f5; padding: 20px; text-align: center; margin: 20px 0;">
              <h2 style="color: #2563eb; font-size: 32px; margin: 0; letter-spacing: 4px;">
                ${newOTP}
              </h2>
            </div>
            <p style="color: #666; font-size: 14px;">
              This code will expire in 10 minutes. If you didn't request this verification, please ignore this email.
            </p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
            <p style="color: #999; font-size: 12px; text-align: center;">
              © 2024 Synapse - AI-Powered Knowledge Management
            </p>
          </div>
        `,
      };

      await transporter.sendMail(mailOptions);

      return NextResponse.json({
        success: true,
        message: "OTP sent successfully",
      });

    } else if (action === "verify") {
      // Verify OTP
      const user = await User.findOne({ email });
      if (!user) {
        return NextResponse.json(
          { success: false, error: "User not found" },
          { status: 404 }
        );
      }

      // Check if OTP is valid and not expired
      if (!user.otp || user.otp !== otp) {
        return NextResponse.json(
          { success: false, error: "Invalid OTP" },
          { status: 400 }
        );
      }

      if (!user.otpExpiry || user.otpExpiry < new Date()) {
        return NextResponse.json(
          { success: false, error: "OTP has expired" },
          { status: 400 }
        );
      }

      // Mark email as verified and clear OTP
      await User.findOneAndUpdate(
        { email },
        {
          emailVerified: new Date(),
          $unset: { otp: 1, otpExpiry: 1 }
        }
      );

      return NextResponse.json({
        success: true,
        message: "Email verified successfully",
      });
    }

    return NextResponse.json(
      { success: false, error: "Invalid action" },
      { status: 400 }
    );

  } catch (error) {
    console.error("OTP verification error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
} 