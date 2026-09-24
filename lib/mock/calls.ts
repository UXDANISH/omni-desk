import type { Call, TranscriptLine } from '../types';
import { patientIdByName } from './patients';

const ai = (text: string): TranscriptLine => ({ who: 'ai', text });
const c = (text: string): TranscriptLine => ({ who: 'caller', text });

type Seed = Omit<Call, 'patientId' | 'phone'> & { phone?: string };

const SEED: Seed[] = [
  {
    id: 'C-20940', time: '8:06 AM', day: 'Today', caller: 'Morgan Sample', last4: '2291', reason: 'New patient, wants a cleaning', outcome: 'Live', duration: '1:48', direction: 'Inbound',
    summary: 'New patient asking for a cleaning and exam. OmniDesk is collecting insurance details and offering Thursday 10:30 AM with the hygienist.',
    next: 'Take over only if the caller asks for a person.',
    facts: [['Reason', 'New patient cleaning'], ['Offered slot', 'Thu 10:30 AM'], ['Insurance', 'Collecting']],
    transcript: [ai('Thanks for calling Smile Dental, this is the virtual receptionist. How can I help?'), c("Hi, I'm new to the area and need a cleaning."), ai('Welcome! I can book a new-patient cleaning and exam. Do you have dental insurance?'), c('Yes, let me find the card…')],
  },
  {
    id: 'C-20931', time: '7:42 AM', day: 'Today', caller: 'Jordan Test', last4: '4417', reason: 'Tooth pain with facial swelling', outcome: 'Needs human', duration: '3:12', afterHours: true, direction: 'Inbound', tag: 'EMERGENCY',
    summary: 'Existing patient with lower-left molar pain since last night and visible cheek swelling. No fever reported. Asked for a same-day visit. Flagged as a possible emergency per escalation rules.',
    next: 'Call back before 8:30 AM to offer the 9:15 AM emergency slot with Dr. Sample.',
    facts: [['Reason', 'Pain + swelling'], ['Escalation', 'Emergency rule'], ['Patient', 'Existing']],
    transcript: [ai("Smile Dental, you've reached the after-hours receptionist. How can I help?"), c("My back tooth is killing me and my cheek's swollen."), ai("I'm sorry you're dealing with that. Is the swelling making it hard to breathe or swallow?"), c('No, it just hurts a lot.'), ai("Understood. I'm flagging this for the team as urgent. Someone will call you back as soon as the office opens at 8 AM."), c('Okay, thank you.')],
  },
  {
    id: 'C-20928', time: '7:15 AM', day: 'Today', caller: 'Alex Example', last4: '8830', reason: 'Is a crown covered by my plan?', outcome: 'Needs human', duration: '2:05', afterHours: true, direction: 'Inbound', tag: 'INSURANCE',
    summary: 'Patient asked whether their PPO plan covers a crown recommended last visit. OmniDesk does not answer coverage questions and offered a callback from the front desk.',
    next: 'Check benefits and call back with an estimate.',
    facts: [['Reason', 'Coverage question'], ['Escalation', 'Insurance rule'], ['Patient', 'Existing']],
    transcript: [ai('Good morning, Smile Dental. How can I help?'), c('Does my insurance cover the crown Dr. Sample recommended?'), ai("I can't confirm coverage, but I can have someone from the front desk check your benefits and call you. Is this the best number?"), c('Yes, this number is fine.')],
  },
  {
    id: 'C-20925', time: '6:58 AM', day: 'Today', caller: 'Taylor Mock', last4: '1204', reason: 'Book a cleaning', outcome: 'Booked', duration: '2:41', afterHours: true, direction: 'Inbound',
    summary: 'Booked a routine cleaning for Friday at 8:00 AM with the hygienist. Confirmation text sent.',
    next: 'None. Reminder goes out automatically the day before.',
    facts: [['Booked', 'Fri 8:00 AM'], ['Service', 'Cleaning · 60 min'], ['Deposit', 'Not required']],
    transcript: [ai("Smile Dental, you've reached the after-hours receptionist."), c('Can I get in for a cleaning this week?'), ai('I have Friday at 8:00 AM or 2:30 PM. Which works better?'), c('8 AM please.'), ai("You're booked for Friday at 8:00 AM. I've texted you a confirmation.")],
  },
  {
    id: 'C-20919', time: '9:12 PM', day: 'Yesterday', caller: 'Sam Fixture', last4: '3356', reason: 'Reschedule crown seat', outcome: 'Booked', duration: '1:57', afterHours: true, direction: 'Inbound',
    summary: "Moved crown seat appointment from Wednesday to Monday at 1:00 PM at the patient's request.",
    next: 'None.',
    facts: [['Booked', 'Mon 1:00 PM'], ['Service', 'Crown seat · 45 min'], ['Was', 'Wed 3:00 PM']],
    transcript: [ai('Smile Dental after hours. How can I help?'), c('I need to move my crown appointment on Wednesday.'), ai('I can offer Monday at 1:00 PM or Tuesday at 9:00 AM.'), c('Monday works.'), ai("Done. You're now booked Monday at 1:00 PM.")],
  },
  {
    id: 'C-20914', time: '5:48 PM', day: 'Yesterday', caller: 'Casey Placeholder', last4: '6072', reason: 'Upset about a bill, asked for manager', outcome: 'Needs human', duration: '4:30', direction: 'Inbound', tag: 'ESCALATION',
    summary: 'Caller disputed a $180 balance after a filling and asked for the office manager. OmniDesk apologized, did not discuss the balance, and promised a callback per the angry-caller rule.',
    next: 'Office manager to call back and review the statement.',
    facts: [['Reason', 'Billing dispute'], ['Escalation', 'Angry caller rule'], ['Patient', 'Existing']],
    transcript: [c("I got a bill I don't understand and I want to talk to a manager."), ai("I'm sorry about the confusion. I can't review balances, but I'll have the office manager call you back."), c('Today?'), ai("The office is closing now, so they'll call first thing tomorrow morning.")],
  },
  {
    id: 'C-20910', time: '4:10 PM', day: 'Yesterday', caller: 'Riley Demo', last4: '9915', reason: 'Book whitening consult', outcome: 'Booked', duration: '3:05', direction: 'Inbound', tag: 'DEPOSIT FAILED', attention: true,
    note: 'Deposit link sent · card declined ($50). Appointment is held until Tue 5 PM.',
    summary: 'Booked a whitening consultation for Wednesday at 11:00 AM and texted a $50 deposit link.',
    next: 'Ask the patient for another card or waive the deposit.',
    facts: [['Booked', 'Wed 11:00 AM'], ['Service', 'Whitening consult · 30 min'], ['Deposit', '$50 · declined']],
    transcript: [c("I'd like to ask about teeth whitening."), ai('I can book a 30-minute consult. Wednesday at 11:00 AM is open. A $50 deposit holds the time and goes toward treatment.'), c("That's fine."), ai("Great, I've texted you a secure payment link.")],
  },
  {
    id: 'C-20905', time: '2:22 PM', day: 'Yesterday', caller: 'Jamie Sample', last4: '7741', reason: 'Office hours and parking', outcome: 'Answered', duration: '0:52', direction: 'Inbound',
    summary: 'Answered questions about Saturday hours and parking. No booking requested.', next: 'None.',
    facts: [['Reason', 'General info'], ['Patient', 'Existing']],
    transcript: [c('Are you open Saturday?'), ai("We're open Saturdays from 8 AM to 12 PM. Parking is free in the lot behind the building.")],
  },
  {
    id: 'C-20899', time: '11:05 AM', day: 'Yesterday', caller: 'Drew Testcase', last4: '5528', reason: 'Recall: 6-month cleaning', outcome: 'Booked', duration: '2:18', direction: 'Outbound · Recall',
    summary: 'Recall call for an overdue 6-month cleaning. Patient booked Thursday at 3:30 PM.', next: 'None.',
    facts: [['Booked', 'Thu 3:30 PM'], ['Campaign', '6-month hygiene'], ['Consent', 'Calls · Texts']],
    transcript: [ai("Hi Drew, this is Smile Dental's virtual assistant. Dr. Sample's office noticed you're due for your cleaning. Would you like to book?"), c('Oh, yes, I forgot.'), ai('I have Thursday at 3:30 PM.'), c('Perfect.')],
  },
  {
    id: 'C-20893', time: '10:31 AM', day: 'Yesterday', caller: 'Avery Mockup', last4: '3190', reason: 'Bleeding after extraction', outcome: 'Transferred', duration: '1:40', direction: 'Inbound',
    summary: 'Post-op question about light bleeding a day after an extraction. Transferred live to the front desk per clinical-question rule.', next: 'Handled by front desk.',
    facts: [['Reason', 'Post-op question'], ['Transferred to', 'Front desk · line 1']],
    transcript: [c("I had a tooth pulled yesterday and it's still bleeding a little."), ai("I'll connect you with the team right now so they can advise you."), ai('Transferring to front desk.')],
  },
  {
    id: 'C-20887', time: '8:47 PM', day: 'Mon', caller: 'Unknown caller', last4: '0063', phone: '(737) 555-0063', reason: 'Hung up before stating a reason', outcome: 'Hang-up', duration: '0:09', afterHours: true, direction: 'Inbound',
    summary: 'Caller disconnected during the greeting. No voicemail left.', next: 'None. Number is not a patient on file.',
    facts: [['Reason', 'None given'], ['Patient', 'Not on file']],
    transcript: [ai('Smile Dental after hours, how can I—'), ai('Caller disconnected.')],
  },
  {
    id: 'C-20880', time: '3:15 PM', day: 'Mon', caller: 'Quinn Example', last4: '4488', reason: 'Cancel appointment', outcome: 'Answered', duration: '1:22', direction: 'Inbound',
    summary: 'Cancelled Tuesday filling appointment. Patient declined to reschedule now and was added to recall.', next: 'Recall follow-up in 7 days.',
    facts: [['Cancelled', 'Tue 9:00 AM'], ['Recall', 'Added · 7 days']],
    transcript: [c('I need to cancel Tuesday.'), ai('Done. Would you like to pick a new time?'), c("Not yet, I'll call back."), ai("No problem, we'll check in with you next week.")],
  },
];

export const CALLS: Call[] = SEED.map((s) => ({
  ...s,
  phone: s.phone ?? `(512) 555-${s.last4}`,
  patientId: patientIdByName(s.caller),
}));
