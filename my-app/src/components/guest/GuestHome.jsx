import React from "react";
import Standings from "../Standings";
import ActivityShortcuts from "../user/ActivityShortcuts";
import TodaySummary from "../user/TodaySummary";
import MatchesTimeline from "../user/MatchesTimeline";
import NewsSection from "../user/NewsSection";

// หน้าแรกสำหรับผู้เยี่ยมชม (ไม่ได้ล็อกอิน) — เหมือนหน้าแรกของนักศึกษา แต่ตัดส่วนข้อมูลส่วนตัว (สังกัดสี/บทบาท/เช็คชื่อ) ออก
export default function GuestHome({ students, matches, visitsToday, news, roles }) {
  return (
    <div className="px-4 md:px-8 pb-10 space-y-6">
      <TodaySummary matches={matches} visitsToday={visitsToday} news={news} />

      <ActivityShortcuts students={students} roles={roles} />

      <Standings matches={matches} />

      <div id="matches-timeline-section" className="scroll-mt-4">
        <MatchesTimeline matches={matches} students={students} />
      </div>

      <NewsSection news={news} />
    </div>
  );
}
