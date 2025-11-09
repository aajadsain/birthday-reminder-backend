import { Injectable, Logger } from "@nestjs/common";
import { Cron } from "@nestjs/schedule";
import { UsersService } from "../modules/users/users.service";
import moment from "moment";
import { sendMail } from "../config/mail.config";
import { Model } from "mongoose";
import { InjectModel } from "@nestjs/mongoose";
import { Notification } from "../modules/notifications/notifications.schema";

// ✅ Validate Email
const isValidEmail = (email: string) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim().toLowerCase());

@Injectable()
export class BirthdayCron {
  private readonly logger = new Logger(BirthdayCron.name);

  constructor(
    private usersService: UsersService,
    @InjectModel(Notification.name)
    private notificationModel: Model<Notification>,
  ) {}

  /**
   * PRODUCTION:
   * Runs at midnight IST (12:00 AM)
   */
  @Cron("0/30 * * * *")
  async checkBirthdays() {
    console.log("\n==========================");
    console.log("🎯 Birthday Cron Running...");
    console.log("==========================");

    // ✅ 1) Check if already sent today
    const targetDate = moment().add(1, "day").format("YYYY-MM-DD");

    const alreadySent = await this.notificationModel.findOne({ date: targetDate });

    if (alreadySent) {
      this.logger.warn(`⛔ Emails already sent for ${targetDate}. Skipping.`);
      return;
    }

    // ✅ 2) Fetch users
    const users = await this.usersService.getAll();

    const tomorrow = moment().add(1, "day").format("MM-DD");

    const birthdayUsers = users.filter(
      (u) => moment(u.dob).format("MM-DD") === tomorrow,
    );

    console.log("🎂 Birthday Users:", birthdayUsers);

    if (!birthdayUsers.length) {
      this.logger.log("No birthdays tomorrow.");
      return;
    }

    // ✅ 3) Build email list
    const allEmails = Array.from(
      new Set(
        users
          .map((u) => u.email?.trim().toLowerCase())
          .filter((e) => isValidEmail(e)),
      ),
    );

    const birthdayEmails = new Set(
      birthdayUsers
        .map((u) => u.email?.trim().toLowerCase())
        .filter(isValidEmail),
    );

    // ✅ Exclude birthday users
    const notifyEmails = allEmails.filter((e) => !birthdayEmails.has(e));

    console.log("📩 Recipients:", notifyEmails);

    if (!notifyEmails.length) {
      this.logger.warn("No recipients to notify.");
      return;
    }

    // ✅ 4) Build email content
    const birthdayNames = birthdayUsers.map((b) => b.name).filter(Boolean);

    const subject = `Birthday Reminder → ${birthdayNames.join(", ")}`;

    const html = `
      <div style="font-family: sans-serif; padding: 12px;">
        <h2>🎉 Tomorrow's Birthday(s)</h2>
        <p>Team, please wish them on their special day!</p>
        <ul>
          ${birthdayNames.map((n) => `<li><b>${n}</b></li>`).join("")}
        </ul>
        <br/>
        <p style="font-size: 12px; color: gray;">
          — Automated reminder from Birthday System
        </p>
      </div>
    `;

    // ✅ 5) Send Emails
    const results: string[] = [];

    for (const email of notifyEmails) {
      try {
        console.log(`📤 Sending → ${email}`);

        await sendMail({
          to: email,
          subject,
          html,
        });

        results.push(email);
      } catch (err) {
        console.error(`❌ Send Failed → ${email} →`, err?.message || err);
      }
    }

    // ✅ 6) Mark as sent for today
    await this.notificationModel.create({
      date: targetDate,
      sentTo: results,
      birthdayPeople: birthdayNames,
    });

    this.logger.log(
      `✅ Birthday notifications sent for ${birthdayUsers.length} users → Recipients: ${results.length}`,
    );
  }
}
