// Central icon map → BoxIcons (react-icons/bi). Import semantic names elsewhere
// so swapping an icon means editing one line here, not hunting across the app.
import {
  BiPlusMedical,
  BiGridAlt,
  BiUser,
  BiCalendar,
  BiBlock,
  BiClipboard,
  BiShieldQuarter,
  BiLockAlt,
  BiTime,
  BiCheckCircle,
  BiCheck,
  BiSend,
  BiErrorCircle,
  BiLogOut,
  BiArrowBack,
  BiRightArrowAlt,
  BiMessageRoundedDots,
  BiX,
  BiXCircle,
  BiMinus,
  BiSupport,
  BiCog,
  BiPalette,
  BiCategoryAlt,
  BiGroup,
  BiTimeFive,
  BiCalendarEvent,
  BiPhone,
  BiTrash,
  BiEditAlt,
  BiPlus,
  BiCalendarCheck,
  BiChevronLeft,
  BiChevronRight,
  BiChevronDown,
  BiSearch,
  BiEnvelope,
  BiHistory,
  BiIdCard,
  BiUserPin,
} from 'react-icons/bi';

export const IconBrand = BiPlusMedical;       // clinic / stethoscope mark
export const IconDashboard = BiGridAlt;
export const IconDoctors = BiUser;
export const IconSchedules = BiCalendar;
export const IconExceptions = BiBlock;
export const IconAppointments = BiClipboard;
export const IconSecure = BiShieldQuarter;
export const IconPrivate = BiLockAlt;
export const IconClock = BiTime;
export const IconSuccess = BiCheckCircle;      // booking complete
export const IconReview = BiClipboard;         // confirm/review
export const IconCheck = BiCheck;              // stepper done
export const IconSend = BiSend;
export const IconWarning = BiErrorCircle;
export const IconSignOut = BiLogOut;
export const IconBack = BiArrowBack;
export const IconArrowRight = BiRightArrowAlt;
export const IconChat = BiMessageRoundedDots;  // floating launcher
export const IconClose = BiX;
export const IconMinimize = BiMinus;
export const IconCancel = BiXCircle;           // cancelled appointment
export const IconHandoff = BiSupport;          // agent handoff

// CMS console
export const IconSettings = BiCog;             // clinic settings
export const IconTheme = BiPalette;            // theme / branding
export const IconSpecialty = BiCategoryAlt;    // specialties
export const IconStaff = BiGroup;              // staff (non-doctor)
export const IconShift = BiTimeFive;           // slot presets / shifts
export const IconRoster = BiCalendarEvent;     // shift assignments
export const IconOnDuty = BiCalendarCheck;
export const IconPhone = BiPhone;
export const IconEmail = BiEnvelope;
export const IconTrash = BiTrash;
export const IconEdit = BiEditAlt;
export const IconPlus = BiPlus;
export const IconPrev = BiChevronLeft;   // calendar month nav
export const IconNext = BiChevronRight;
export const IconExpand = BiChevronDown; // select / disclosure caret
export const IconSearch = BiSearch;

// V4 auth / RBAC
export const IconAudit = BiHistory;      // audit log
export const IconPosition = BiIdCard;    // positions
export const IconUsers = BiUserPin;      // user accounts
