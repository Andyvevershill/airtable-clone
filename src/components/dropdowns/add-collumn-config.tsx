import { BiMessageSquareDots } from "react-icons/bi";
import { BsCalendar2Date } from "react-icons/bs";
import {
  CiBarcode,
  CiClock2,
  CiPhone,
  CiStar,
  CiTextAlignLeft,
  CiUser,
} from "react-icons/ci";
import { FaA } from "react-icons/fa6";
import { FiPercent } from "react-icons/fi";
import { GoMultiSelect } from "react-icons/go";
import { HiOutlineBuildingOffice2, HiOutlineCalculator } from "react-icons/hi2";
import { IoIosArrowDropdown, IoIosLink } from "react-icons/io";
import {
  IoCheckboxOutline,
  IoDocumentOutline,
  IoDocumentsOutline,
  IoImageOutline,
} from "react-icons/io5";
import { LuListEnd } from "react-icons/lu";
import { MdOutlineImageSearch, MdOutlineMail } from "react-icons/md";
import {
  PiCurrencyDollar,
  PiCursor,
  PiHashStraightLight,
  PiListNumbersLight,
  PiSquaresFourLight,
} from "react-icons/pi";
import { RiFormula } from "react-icons/ri";
import {
  TbCakeRoll,
  TbCalendarBolt,
  TbListSearch,
  TbUserBolt,
} from "react-icons/tb";

export const fieldAgents = [
  { icon: IoDocumentOutline, name: "Analyze attachment", colour: "green" },
  {
    icon: HiOutlineBuildingOffice2,
    name: "Research companies",
    colour: "blue",
  },
  { icon: MdOutlineImageSearch, name: "Find image from web", colour: "purple" },
  { icon: IoImageOutline, name: "Generate image", colour: "orange" },
  { icon: IoDocumentsOutline, name: "Categorize assets", colour: "orange" },
  { icon: PiCursor, name: "Build prototype", colour: "purple" },
  { icon: BiMessageSquareDots, name: "Build a field agent", colour: "slate" },
  { icon: PiSquaresFourLight, name: "Browse catalog", colour: "slate" },
];

export const standardFields = [
  { icon: LuListEnd, name: "Link to another record" },
  { icon: FaA, name: "Single line text" },
  { icon: CiTextAlignLeft, name: "Long text" },
  { icon: IoDocumentOutline, name: "Attachment" },
  { icon: IoCheckboxOutline, name: "Checkbox" },
  { icon: GoMultiSelect, name: "Multiple select" },
  { icon: IoIosArrowDropdown, name: "Single select" },
  { icon: CiUser, name: "User" },
  { icon: BsCalendar2Date, name: "Date" },
  { icon: CiPhone, name: "Phone number" },
  { icon: MdOutlineMail, name: "Email" },
  { icon: IoIosLink, name: "URL" },
  { icon: PiHashStraightLight, name: "Number" },
  { icon: PiCurrencyDollar, name: "Currency" },
  { icon: FiPercent, name: "Percent" },
  { icon: CiClock2, name: "Duration" },
  { icon: CiStar, name: "Rating" },
  { icon: RiFormula, name: "Formula" },
  { icon: TbCakeRoll, name: "Rollup" },
  { icon: HiOutlineCalculator, name: "Count" },
  { icon: TbListSearch, name: "Lookup" },
  { icon: TbCalendarBolt, name: "Created time" },
  { icon: TbCalendarBolt, name: "Last modified time" },
  { icon: TbUserBolt, name: "Created by" },
  { icon: TbUserBolt, name: "Last modified by" },
  { icon: PiListNumbersLight, name: "Autonumber" },
  { icon: CiBarcode, name: "Barcode" },
  { icon: PiCursor, name: "Button" },
];

export const fieldIconClasses: Record<string, string> = {
  green: "text-green-600",
  blue: "text-blue-600",
  purple: "text-purple-600",
  orange: "text-orange-600",
  slate: "text-slate-600",
};

export const hoverBgColors: Record<string, string> = {
  green: "#f0fdf4",
  blue: "#eff6ff",
  purple: "#faf5ff",
  orange: "#fff7ed",
  slate: "#f8fafc",
};
