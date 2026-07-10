import { IconCheck } from '../icons';

// Booking progress. Derived purely from `stage` — no local state to drift.
const STEPS = [
  { key: 'specialty', label: 'Specialty', stages: ['select_specialty'] },
  { key: 'doctor', label: 'Doctor', stages: ['select_doctor'] },
  { key: 'date', label: 'Date', stages: ['select_date'] },
  { key: 'time', label: 'Time', stages: ['select_slot'] },
  { key: 'details', label: 'Details', stages: ['collect_patient_name', 'collect_patient_phone'] },
  { key: 'confirm', label: 'Confirm', stages: ['confirm_booking', 'booking_complete'] },
];

// Order of stages for computing "past vs upcoming".
const ORDER = [
  'greeting', 'select_specialty', 'select_doctor', 'select_date', 'select_slot',
  'collect_patient_name', 'collect_patient_phone', 'confirm_booking', 'booking_complete',
];

export default function ProgressStepper({ stage }) {
  const currentIdx = ORDER.indexOf(stage);
  return (
    <ol className="stepper" aria-label="Booking progress">
      {STEPS.map((step) => {
        const isCurrent = step.stages.includes(stage);
        const isDone = currentIdx > Math.max(...step.stages.map((s) => ORDER.indexOf(s)));
        const state = isCurrent ? 'current' : isDone ? 'done' : 'upcoming';
        return (
          <li key={step.key} className={`stepper__item stepper__item--${state}`}
              aria-current={isCurrent ? 'step' : undefined}>
            <span className="stepper__dot" aria-hidden="true">{isDone ? <IconCheck /> : ''}</span>
            <span className="stepper__label">{step.label}</span>
          </li>
        );
      })}
    </ol>
  );
}
