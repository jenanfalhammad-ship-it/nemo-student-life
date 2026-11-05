import fox from "@/assets/animal-fox.png";
import penguin from "@/assets/animal-penguin.png";
import turtle from "@/assets/animal-turtle.png";
import dragon from "@/assets/animal-dragon.png";

export type Rarity = "common" | "rare" | "epic" | "legendary";
export type Habitat = "forest" | "ocean" | "snow" | "magic";
export type Animal = { key: string; en: string; ar: string; rarity: Rarity; habitat: Habitat; img?: string; emoji: string };

export const ANIMALS: Animal[] = [
  { key: "fox", en: "Ember the Fox", ar: "جمرة الثعلب", rarity: "common", habitat: "forest", img: fox, emoji: "🦊" },
  { key: "rabbit", en: "Clover the Rabbit", ar: "برسيم الأرنب", rarity: "common", habitat: "forest", emoji: "🐰" },
  { key: "turtle", en: "Pebble the Turtle", ar: "حصاة السلحفاة", rarity: "common", habitat: "ocean", img: turtle, emoji: "🐢" },
  { key: "fish", en: "Bubbles the Fish", ar: "فقاعة السمكة", rarity: "common", habitat: "ocean", emoji: "🐠" },
  { key: "penguin", en: "Frost the Penguin", ar: "صقيع البطريق", rarity: "rare", habitat: "snow", img: penguin, emoji: "🐧" },
  { key: "owl", en: "Sage the Owl", ar: "حكيم البومة", rarity: "rare", habitat: "forest", emoji: "🦉" },
  { key: "whale", en: "Tide the Whale", ar: "مدّ الحوت", rarity: "epic", habitat: "ocean", emoji: "🐋" },
  { key: "polar", en: "Snowy the Bear", ar: "ثلج الدب", rarity: "epic", habitat: "snow", emoji: "🐻‍❄️" },
  { key: "unicorn", en: "Luna the Unicorn", ar: "لونا وحيد القرن", rarity: "legendary", habitat: "magic", emoji: "🦄" },
  { key: "dragon", en: "Spark the Dragon", ar: "شرارة التنين", rarity: "legendary", habitat: "magic", img: dragon, emoji: "🐉" },
];

export const VERSES = [
  { ar: "فَإِنَّ مَعَ الْعُسْرِ يُسْرًا", en: "For indeed, with hardship comes ease.", ref: "Ash-Sharh 94:5" },
  { ar: "وَقُل رَّبِّ زِدْنِي عِلْمًا", en: "And say: My Lord, increase me in knowledge.", ref: "Taha 20:114" },
  { ar: "لَا يُكَلِّفُ اللَّهُ نَفْسًا إِلَّا وُسْعَهَا", en: "Allah does not burden a soul beyond that it can bear.", ref: "Al-Baqarah 2:286" },
  { ar: "إِنَّ اللَّهَ مَعَ الصَّابِرِينَ", en: "Indeed, Allah is with the patient.", ref: "Al-Baqarah 2:153" },
  { ar: "وَأَن لَّيْسَ لِلْإِنسَانِ إِلَّا مَا سَعَىٰ", en: "And that there is not for man except that for which he strives.", ref: "An-Najm 53:39" },
  { ar: "اقْرَأْ بِاسْمِ رَبِّكَ الَّذِي خَلَقَ", en: "Read in the name of your Lord who created.", ref: "Al-Alaq 96:1" },
  { ar: "وَمَن يَتَوَكَّلْ عَلَى اللَّهِ فَهُوَ حَسْبُهُ", en: "Whoever relies upon Allah — He is sufficient for him.", ref: "At-Talaq 65:3" },
];

export const COURSE_COLORS = ["#6b9e8a", "#9a86c9", "#e0a07a", "#7aa3d6", "#d77a7a", "#c9b46b", "#6bb3b3", "#b07ab0"];
export const EVENT_KINDS = ["lecture", "exam", "quiz", "assignment", "project", "study", "personalEv", "activity", "conference", "workshop", "seminar", "club", "meeting", "registration"] as const;
export const UNI_EVENT_KINDS = ["activity", "conference", "workshop", "seminar", "club", "meeting", "registration"];
export const TASK_CATS = ["university_c", "studying_c", "personal_c", "projects_c", "activities_c", "other_c"] as const;
export const REMINDER_CATS = ["academicR", "personalR", "healthR", "projectsR", "otherR"] as const;
export const COUNTDOWN_CATS = ["exam", "midterm", "final", "assignment", "project", "graduation", "scholarship", "personalEv"] as const;
export const KIND_COLOR: Record<string, string> = {
  lecture: "bg-sky", exam: "bg-peach", quiz: "bg-peach", assignment: "bg-lavender", project: "bg-lavender",
  study: "bg-sage-soft", personalEv: "bg-muted", default: "bg-accent",
};
