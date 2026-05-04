import {
  forwardRef,
  type ForwardRefExoticComponent,
  type RefAttributes,
} from "react";
import * as Lucide from "lucide-react";
import type {
  LucideIcon as LucideIconComponent,
  LucideProps,
} from "lucide-react";
import * as Phosphor from "@phosphor-icons/react";
import type {
  Icon as PhosphorIconComponent,
  IconProps as PhosphorIconProps,
} from "@phosphor-icons/react";
import { useAppearance } from "@/context/AppearanceContext";

export type IconProps = PhosphorIconProps & {
  absoluteStrokeWidth?: boolean;
  strokeWidth?: string | number;
};

export type AppIcon = ForwardRefExoticComponent<
  IconProps & RefAttributes<SVGSVGElement>
>;

export type PhosphorIcon = AppIcon;

function createIcon(
  displayName: string,
  LucideIcon: LucideIconComponent,
  PhosphorIcon: PhosphorIconComponent,
): AppIcon {
  const WrappedIcon = forwardRef<SVGSVGElement, IconProps>(
    (
      {
        absoluteStrokeWidth,
        strokeWidth,
        weight = "regular",
        ...props
      },
      ref,
    ) => {
      const { settings } = useAppearance();

      if (settings.iconLibrary === "lucide") {
        const lucideProps: LucideProps = {
          ...props,
          absoluteStrokeWidth,
          strokeWidth: strokeWidth ?? (weight === "fill" ? 2.6 : undefined),
        };

        return <LucideIcon ref={ref} {...lucideProps} />;
      }

      return <PhosphorIcon ref={ref} weight={weight} {...props} />;
    },
  );

  WrappedIcon.displayName = displayName;

  return WrappedIcon;
}

export const Activity = createIcon("Activity", Lucide.Activity, Phosphor.Pulse);
export const AlarmClock = createIcon("AlarmClock", Lucide.AlarmClock, Phosphor.Alarm);
export const AlertCircle = createIcon("AlertCircle", Lucide.AlertCircle, Phosphor.WarningCircle);
export const AlertTriangle = createIcon("AlertTriangle", Lucide.AlertTriangle, Phosphor.Warning);
export const AlignLeft = createIcon("AlignLeft", Lucide.AlignLeft, Phosphor.AlignLeft);
export const AlignRight = createIcon("AlignRight", Lucide.AlignRight, Phosphor.AlignRight);
export const AlignStartVertical = createIcon("AlignStartVertical", Lucide.AlignStartVertical, Phosphor.AlignTopSimple);
export const Archive = createIcon("Archive", Lucide.Archive, Phosphor.Archive);
export const ArrowDown = createIcon("ArrowDown", Lucide.ArrowDown, Phosphor.ArrowDown);
export const ArrowDownLeft = createIcon("ArrowDownLeft", Lucide.ArrowDownLeft, Phosphor.ArrowDownLeft);
export const ArrowLeft = createIcon("ArrowLeft", Lucide.ArrowLeft, Phosphor.ArrowLeft);
export const ArrowRight = createIcon("ArrowRight", Lucide.ArrowRight, Phosphor.ArrowRight);
export const ArrowRightLeft = createIcon("ArrowRightLeft", Lucide.ArrowRightLeft, Phosphor.ArrowsLeftRight);
export const ArrowUp = createIcon("ArrowUp", Lucide.ArrowUp, Phosphor.ArrowUp);
export const ArrowUpDown = createIcon("ArrowUpDown", Lucide.ArrowUpDown, Phosphor.ArrowsDownUp);
export const ArrowUpRight = createIcon("ArrowUpRight", Lucide.ArrowUpRight, Phosphor.ArrowUpRight);
export const AtSign = createIcon("AtSign", Lucide.AtSign, Phosphor.At);
export const BadgeCheck = createIcon("BadgeCheck", Lucide.BadgeCheck, Phosphor.SealCheck);
export const BarChart2 = createIcon("BarChart2", Lucide.BarChart2, Phosphor.ChartBar);
export const BarChart3 = createIcon("BarChart3", Lucide.BarChart3, Phosphor.ChartBar);
export const Bell = createIcon("Bell", Lucide.Bell, Phosphor.Bell);
export const BellOff = createIcon("BellOff", Lucide.BellOff, Phosphor.BellSlash);
export const Blocks = createIcon("Blocks", Lucide.Blocks, Phosphor.SquaresFour);
export const Bold = createIcon("Bold", Lucide.Bold, Phosphor.TextB);
export const BookCheck = createIcon("BookCheck", Lucide.BookCheck, Phosphor.BookOpenText);
export const BookOpen = createIcon("BookOpen", Lucide.BookOpen, Phosphor.BookOpen);
export const Bot = createIcon("Bot", Lucide.Bot, Phosphor.Robot);
export const Brain = createIcon("Brain", Lucide.Brain, Phosphor.Brain);
export const BriefcaseBusiness = createIcon("BriefcaseBusiness", Lucide.BriefcaseBusiness, Phosphor.Briefcase);
export const Building = createIcon("Building", Lucide.Building, Phosphor.Building);
export const Building2 = createIcon("Building2", Lucide.Building2, Phosphor.Buildings);
export const Calendar = createIcon("Calendar", Lucide.Calendar, Phosphor.Calendar);
export const Camera = createIcon("Camera", Lucide.Camera, Phosphor.Camera);
export const ChartColumnBig = createIcon("ChartColumnBig", Lucide.ChartColumnBig, Phosphor.ChartBar);
export const Check = createIcon("Check", Lucide.Check, Phosphor.Check);
export const CheckCheck = createIcon("CheckCheck", Lucide.CheckCheck, Phosphor.Checks);
export const CheckCircle = createIcon("CheckCircle", Lucide.CheckCircle, Phosphor.CheckCircle);
export const CheckCircle2 = createIcon("CheckCircle2", Lucide.CheckCircle2, Phosphor.CheckCircle);
export const CheckSquare = createIcon("CheckSquare", Lucide.CheckSquare, Phosphor.CheckSquare);
export const ChevronDown = createIcon("ChevronDown", Lucide.ChevronDown, Phosphor.CaretDown);
export const ChevronLeft = createIcon("ChevronLeft", Lucide.ChevronLeft, Phosphor.CaretLeft);
export const ChevronRight = createIcon("ChevronRight", Lucide.ChevronRight, Phosphor.CaretRight);
export const ChevronUp = createIcon("ChevronUp", Lucide.ChevronUp, Phosphor.CaretUp);
export const Circle = createIcon("Circle", Lucide.Circle, Phosphor.Circle);
export const CirclePause = createIcon("CirclePause", Lucide.CirclePause, Phosphor.PauseCircle);
export const CircleUserRound = createIcon("CircleUserRound", Lucide.CircleUserRound, Phosphor.UserCircle);
export const ClipboardList = createIcon("ClipboardList", Lucide.ClipboardList, Phosphor.ClipboardText);
export const Clock = createIcon("Clock", Lucide.Clock, Phosphor.Clock);
export const Clock3 = createIcon("Clock3", Lucide.Clock3, Phosphor.Clock);
export const Code2 = createIcon("Code2", Lucide.Code2, Phosphor.Code);
export const Compass = createIcon("Compass", Lucide.Compass, Phosphor.Compass);
export const ConciergeBell = createIcon("ConciergeBell", Lucide.ConciergeBell, Phosphor.BellRinging);
export const Contact = createIcon("Contact", Lucide.Contact, Phosphor.AddressBook);
export const ContactRound = createIcon("ContactRound", Lucide.ContactRound, Phosphor.UserCircle);
export const Contrast = createIcon("Contrast", Lucide.Contrast, Phosphor.CircleHalf);
export const Copy = createIcon("Copy", Lucide.Copy, Phosphor.Copy);
export const CornerDownRight = createIcon("CornerDownRight", Lucide.CornerDownRight, Phosphor.ArrowBendDownRight);
export const CornerUpLeft = createIcon("CornerUpLeft", Lucide.CornerUpLeft, Phosphor.ArrowBendUpLeft);
export const CornerUpRight = createIcon("CornerUpRight", Lucide.CornerUpRight, Phosphor.ArrowBendUpRight);
export const Cpu = createIcon("Cpu", Lucide.Cpu, Phosphor.Cpu);
export const CreditCard = createIcon("CreditCard", Lucide.CreditCard, Phosphor.CreditCard);
export const Crown = createIcon("Crown", Lucide.Crown, Phosphor.Crown);
export const Database = createIcon("Database", Lucide.Database, Phosphor.Database);
export const DollarSign = createIcon("DollarSign", Lucide.DollarSign, Phosphor.CurrencyDollar);
export const Download = createIcon("Download", Lucide.Download, Phosphor.Download);
export const Edit2 = createIcon("Edit2", Lucide.Edit2, Phosphor.PencilSimple);
export const Edit3 = createIcon("Edit3", Lucide.Edit3, Phosphor.PencilSimpleLine);
export const ExternalLink = createIcon("ExternalLink", Lucide.ExternalLink, Phosphor.ArrowSquareOut);
export const Eye = createIcon("Eye", Lucide.Eye, Phosphor.Eye);
export const EyeOff = createIcon("EyeOff", Lucide.EyeOff, Phosphor.EyeSlash);
export const Facebook = createIcon("Facebook", Lucide.Facebook, Phosphor.FacebookLogo);
export const Factory = createIcon("Factory", Lucide.Factory, Phosphor.Factory);
export const File = createIcon("File", Lucide.File, Phosphor.File);
export const FileImage = createIcon("FileImage", Lucide.FileImage, Phosphor.FileImage);
export const FileSpreadsheet = createIcon("FileSpreadsheet", Lucide.FileSpreadsheet, Phosphor.FileXls);
export const FileText = createIcon("FileText", Lucide.FileText, Phosphor.FileText);
export const Filter = createIcon("Filter", Lucide.Filter, Phosphor.FunnelSimple);
export const Gauge = createIcon("Gauge", Lucide.Gauge, Phosphor.Gauge);
export const GitBranch = createIcon("GitBranch", Lucide.GitBranch, Phosphor.GitBranch);
export const GitMerge = createIcon("GitMerge", Lucide.GitMerge, Phosphor.GitMerge);
export const Globe = createIcon("Globe", Lucide.Globe, Phosphor.Globe);
export const Globe2 = createIcon("Globe2", Lucide.Globe2, Phosphor.GlobeHemisphereWest);
export const Grid3x3 = createIcon("Grid3x3", Lucide.Grid3x3, Phosphor.GridNine);
export const GripVertical = createIcon("GripVertical", Lucide.GripVertical, Phosphor.DotsSixVertical);
export const Hand = createIcon("Hand", Lucide.Hand, Phosphor.Hand);
export const Hash = createIcon("Hash", Lucide.Hash, Phosphor.Hash);
export const Headphones = createIcon("Headphones", Lucide.Headphones, Phosphor.Headphones);
export const Heart = createIcon("Heart", Lucide.Heart, Phosphor.Heart);
export const HelpCircle = createIcon("HelpCircle", Lucide.HelpCircle, Phosphor.Question);
export const History = createIcon("History", Lucide.History, Phosphor.ClockCounterClockwise);
export const Home = createIcon("Home", Lucide.Home, Phosphor.House);
export const Image = createIcon("Image", Lucide.Image, Phosphor.Image);
export const ImageIcon = createIcon("ImageIcon", Lucide.ImageIcon, Phosphor.Image);
export const Inbox = createIcon("Inbox", Lucide.Inbox, Phosphor.Tray);
export const Info = createIcon("Info", Lucide.Info, Phosphor.Info);
export const Instagram = createIcon("Instagram", Lucide.Instagram, Phosphor.InstagramLogo);
export const Italic = createIcon("Italic", Lucide.Italic, Phosphor.TextItalic);
export const Key = createIcon("Key", Lucide.Key, Phosphor.Key);
export const KeyRound = createIcon("KeyRound", Lucide.KeyRound, Phosphor.Key);
export const Languages = createIcon("Languages", Lucide.Languages, Phosphor.Translate);
export const LayoutDashboard = createIcon("LayoutDashboard", Lucide.LayoutDashboard, Phosphor.Gauge);
export const LayoutGrid = createIcon("LayoutGrid", Lucide.LayoutGrid, Phosphor.GridFour);
export const LayoutTemplate = createIcon("LayoutTemplate", Lucide.LayoutTemplate, Phosphor.Layout);
export const Link = createIcon("Link", Lucide.Link, Phosphor.Link);
export const List = createIcon("List", Lucide.List, Phosphor.List);
export const ListFilter = createIcon("ListFilter", Lucide.ListFilter, Phosphor.FunnelSimple);
export const ListOrdered = createIcon("ListOrdered", Lucide.ListOrdered, Phosphor.ListNumbers);
export const Loader = createIcon("Loader", Lucide.Loader, Phosphor.CircleNotch);
export const Loader2 = createIcon("Loader2", Lucide.Loader2, Phosphor.CircleNotch);
export const Lock = createIcon("Lock", Lucide.Lock, Phosphor.LockSimpleIcon);
export const LockKeyhole = createIcon("LockKeyhole", Lucide.LockKeyhole, Phosphor.LockKeyIcon);
export const LockOpen = createIcon("LockOpen", Lucide.LockOpen, Phosphor.LockOpen);
export const LogIn = createIcon("LogIn", Lucide.LogIn, Phosphor.SignIn);
export const LogOut = createIcon("LogOut", Lucide.LogOut, Phosphor.SignOut);
export const Mail = createIcon("Mail", Lucide.Mail, Phosphor.Envelope);
export const Map = createIcon("Map", Lucide.Map, Phosphor.MapTrifold);
export const MapPin = createIcon("MapPin", Lucide.MapPin, Phosphor.MapPin);
export const Megaphone = createIcon("Megaphone", Lucide.Megaphone, Phosphor.Megaphone);
export const Menu = createIcon("Menu", Lucide.Menu, Phosphor.List);
export const MessageCircle = createIcon("MessageCircle", Lucide.MessageCircle, Phosphor.ChatCircle);
export const MessageCircleMore = createIcon("MessageCircleMore", Lucide.MessageCircleMore, Phosphor.ChatCircleDots);
export const MessageSquare = createIcon("MessageSquare", Lucide.MessageSquare, Phosphor.ChatText);
export const MessageSquareText = createIcon("MessageSquareText", Lucide.MessageSquareText, Phosphor.ChatCircleText);
export const Mic = createIcon("Mic", Lucide.Mic, Phosphor.Microphone);
export const MicOff = createIcon("MicOff", Lucide.MicOff, Phosphor.MicrophoneSlash);
export const Minus = createIcon("Minus", Lucide.Minus, Phosphor.Minus);
export const MonitorSmartphone = createIcon("MonitorSmartphone", Lucide.MonitorSmartphone, Phosphor.Devices);
export const Moon = createIcon("Moon", Lucide.Moon, Phosphor.Moon);
export const MoreHorizontal = createIcon("MoreHorizontal", Lucide.MoreHorizontal, Phosphor.DotsThree);
export const MoreVertical = createIcon("MoreVertical", Lucide.MoreVertical, Phosphor.DotsThreeVertical);
export const MousePointerClick = createIcon("MousePointerClick", Lucide.MousePointerClick, Phosphor.CursorClick);
export const Music = createIcon("Music", Lucide.Music, Phosphor.MusicNote);
export const Package = createIcon("Package", Lucide.Package, Phosphor.Package);
export const Palette = createIcon("Palette", Lucide.Palette, Phosphor.Palette);
export const PanelLeft = createIcon("PanelLeft", Lucide.PanelLeft, Phosphor.Sidebar);
export const PanelLeftOpen = createIcon("PanelLeftOpen", Lucide.PanelLeftOpen, Phosphor.SidebarSimple);
export const PanelRightOpen = createIcon("PanelRightOpen", Lucide.PanelRightOpen, Phosphor.SidebarSimple);
export const Paperclip = createIcon("Paperclip", Lucide.Paperclip, Phosphor.Paperclip);
export const Pause = createIcon("Pause", Lucide.Pause, Phosphor.Pause);
export const Pencil = createIcon("Pencil", Lucide.Pencil, Phosphor.Pencil);
export const Phone = createIcon("Phone", Lucide.Phone, Phosphor.Phone);
export const PhoneCall = createIcon("PhoneCall", Lucide.PhoneCall, Phosphor.PhoneCall);
export const PhoneOff = createIcon("PhoneOff", Lucide.PhoneOff, Phosphor.PhoneDisconnect);
export const Play = createIcon("Play", Lucide.Play, Phosphor.Play);
export const Plus = createIcon("Plus", Lucide.Plus, Phosphor.Plus);
export const Radio = createIcon("Radio", Lucide.Radio, Phosphor.Radio);
export const RadioTower = createIcon("RadioTower", Lucide.RadioTower, Phosphor.Broadcast);
export const ReceiptText = createIcon("ReceiptText", Lucide.ReceiptText, Phosphor.Receipt);
export const RefreshCcw = createIcon("RefreshCcw", Lucide.RefreshCcw, Phosphor.ArrowCounterClockwise);
export const RefreshCw = createIcon("RefreshCw", Lucide.RefreshCw, Phosphor.ArrowsClockwise);
export const Reply = createIcon("Reply", Lucide.Reply, Phosphor.ArrowBendUpLeft);
export const Rocket = createIcon("Rocket", Lucide.Rocket, Phosphor.Rocket);
export const RotateCcw = createIcon("RotateCcw", Lucide.RotateCcw, Phosphor.ArrowCounterClockwise);
export const Save = createIcon("Save", Lucide.Save, Phosphor.FloppyDisk);
export const Search = createIcon("Search", Lucide.Search, Phosphor.MagnifyingGlass);
export const SearchX = createIcon("SearchX", Lucide.SearchX, Phosphor.MagnifyingGlassMinus);
export const Send = createIcon("Send", Lucide.Send, Phosphor.PaperPlaneTilt);
export const Server = createIcon("Server", Lucide.Server, Phosphor.HardDrive);
export const Settings = createIcon("Settings", Lucide.Settings, Phosphor.Gear);
export const Shield = createIcon("Shield", Lucide.Shield, Phosphor.Shield);
export const ShieldAlert = createIcon("ShieldAlert", Lucide.ShieldAlert, Phosphor.ShieldWarning);
export const ShieldCheck = createIcon("ShieldCheck", Lucide.ShieldCheck, Phosphor.ShieldCheck);
export const ShoppingBag = createIcon("ShoppingBag", Lucide.ShoppingBag, Phosphor.ShoppingBag);
export const ShoppingCart = createIcon("ShoppingCart", Lucide.ShoppingCart, Phosphor.ShoppingCart);
export const Siren = createIcon("Siren", Lucide.Siren, Phosphor.Siren);
export const Smile = createIcon("Smile", Lucide.Smile, Phosphor.Smiley);
export const Sparkles = createIcon("Sparkles", Lucide.Sparkles, Phosphor.Sparkle);
export const Square = createIcon("Square", Lucide.Square, Phosphor.Square);
export const Star = createIcon("Star", Lucide.Star, Phosphor.Star);
export const StickyNote = createIcon("StickyNote", Lucide.StickyNote, Phosphor.Note);
export const Store = createIcon("Store", Lucide.Store, Phosphor.Storefront);
export const Strikethrough = createIcon("Strikethrough", Lucide.Strikethrough, Phosphor.TextStrikethrough);
export const Sun = createIcon("Sun", Lucide.Sun, Phosphor.Sun);
export const Table = createIcon("Table", Lucide.Table, Phosphor.Table);
export const Tag = createIcon("Tag", Lucide.Tag, Phosphor.Tag);
export const TestTube2 = createIcon("TestTube2", Lucide.TestTube2, Phosphor.TestTube);
export const ThumbsUp = createIcon("ThumbsUp", Lucide.ThumbsUp, Phosphor.ThumbsUp);
export const Trash2 = createIcon("Trash2", Lucide.Trash2, Phosphor.Trash);
export const TrendingDown = createIcon("TrendingDown", Lucide.TrendingDown, Phosphor.TrendDown);
export const TrendingUp = createIcon("TrendingUp", Lucide.TrendingUp, Phosphor.TrendUp);
export const Type = createIcon("Type", Lucide.Type, Phosphor.TextT);
export const Underline = createIcon("Underline", Lucide.Underline, Phosphor.TextUnderline);
export const Upload = createIcon("Upload", Lucide.Upload, Phosphor.Upload);
export const UploadCloud = createIcon("UploadCloud", Lucide.UploadCloud, Phosphor.CloudArrowUp);
export const User = createIcon("User", Lucide.User, Phosphor.User);
export const UserCheck = createIcon("UserCheck", Lucide.UserCheck, Phosphor.UserCheck);
export const UserCircle2 = createIcon("UserCircle2", Lucide.UserCircle2, Phosphor.UserCircle);
export const UserCog = createIcon("UserCog", Lucide.UserCog, Phosphor.UserGear);
export const UserMinus = createIcon("UserMinus", Lucide.UserMinus, Phosphor.UserMinus);
export const UserPlus = createIcon("UserPlus", Lucide.UserPlus, Phosphor.UserPlus);
export const UserPlus2 = createIcon("UserPlus2", Lucide.UserPlus2, Phosphor.UserPlus);
export const UserRound = createIcon("UserRound", Lucide.UserRound, Phosphor.User);
export const UserRoundCheck = createIcon("UserRoundCheck", Lucide.UserRoundCheck, Phosphor.UserCheck);
export const UserRoundPlus = createIcon("UserRoundPlus", Lucide.UserRoundPlus, Phosphor.UserPlus);
export const Users = createIcon("Users", Lucide.Users, Phosphor.Users);
export const Users2 = createIcon("Users2", Lucide.Users2, Phosphor.Users);
export const UsersRound = createIcon("UsersRound", Lucide.UsersRound, Phosphor.UsersThree);
export const Video = createIcon("Video", Lucide.Video, Phosphor.Video);
export const Volume2 = createIcon("Volume2", Lucide.Volume2, Phosphor.SpeakerHigh);
export const VolumeX = createIcon("VolumeX", Lucide.VolumeX, Phosphor.SpeakerX);
export const WalletCards = createIcon("WalletCards", Lucide.WalletCards, Phosphor.Wallet);
export const Wand2 = createIcon("Wand2", Lucide.Wand2, Phosphor.MagicWand);
export const Webhook = createIcon("Webhook", Lucide.Webhook, Phosphor.WebhooksLogo);
export const WifiOff = createIcon("WifiOff", Lucide.WifiOff, Phosphor.WifiX);
export const Workflow = createIcon("Workflow", Lucide.Workflow, Phosphor.TreeStructureIcon );
export const Wrench = createIcon("Wrench", Lucide.Wrench, Phosphor.Wrench);
export const X = createIcon("X", Lucide.X, Phosphor.XIcon);
export const XCircle = createIcon("XCircle", Lucide.XCircle, Phosphor.XCircle);
export const Zap = createIcon("Zap", Lucide.Zap, Phosphor.Lightning);
