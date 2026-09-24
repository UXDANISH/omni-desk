import type { Patient } from '../types';

type Row = [name: string, last4: string, since: string, lastVisit: string, consent: [0 | 1, 0 | 1, 0 | 1], preferred: string];

const ROWS: Row[] = [
  ['Jordan Test', '4417', '2019', 'Mar 3, 2026', [1, 1, 1], 'Text'],
  ['Alex Example', '8830', '2021', 'Apr 20, 2026', [1, 1, 0], 'Call'],
  ['Taylor Mock', '1204', '2022', 'Mar 28, 2026', [1, 1, 1], 'Text'],
  ['Sam Fixture', '3356', '2018', 'Sep 9, 2026', [1, 1, 0], 'Call'],
  ['Casey Placeholder', '6072', '2020', 'Aug 30, 2026', [1, 0, 1], 'Email'],
  ['Riley Demo', '9915', '2026', '—', [1, 1, 1], 'Text'],
  ['Jamie Sample', '7741', '2017', 'Jun 2, 2026', [1, 1, 1], 'Text'],
  ['Drew Testcase', '5528', '2020', 'Feb 11, 2026', [1, 1, 0], 'Call'],
  ['Avery Mockup', '3190', '2023', 'Sep 21, 2026', [1, 1, 1], 'Text'],
  ['Quinn Example', '4488', '2021', 'Jan 15, 2026', [0, 1, 1], 'Text'],
  ['Parker Dummy', '2210', '2022', 'Sep 13, 2026', [1, 1, 0], 'Call'],
  ['Reese Trial', '6643', '2019', 'Jul 8, 2026', [1, 1, 1], 'Email'],
  ['Skyler Draft', '1876', '2026', '—', [1, 1, 1], 'Text'],
  ['Rowan Stub', '5092', '2016', 'Oct 30, 2025', [0, 0, 0], '—'],
  ['Emerson Proto', '7310', '2024', 'Nov 4, 2025', [1, 0, 1], 'Call'],
  ['Hayden Beta', '2457', '2022', 'Mar 1, 2026', [1, 1, 1], 'Text'],
  ['Finley Mock', '8124', '2023', 'Mar 16, 2026', [1, 1, 1], 'Text'],
  ['Kendall Test', '3308', '2021', 'Aug 4, 2026', [1, 1, 1], 'Text'],
  ['Logan Sample', '9061', '2020', 'May 22, 2026', [1, 1, 0], 'Call'],
  ['Morgan Sample', '2291', '2026', '—', [1, 1, 1], 'Call'],
];

export const slug = (name: string) => 'p-' + name.toLowerCase().replace(/[^a-z]+/g, '-');

export const PATIENTS: Patient[] = ROWS.map(([name, last4, since, lastVisit, c, preferred]) => ({
  id: slug(name),
  name,
  last4,
  phone: `(512) 555-${last4}`,
  email: `${name.split(' ')[0].toLowerCase()}.${name.split(' ')[1][0].toLowerCase()}@example.com`,
  since,
  lastVisit,
  consent: { call: !!c[0], text: !!c[1], email: !!c[2] },
  preferred,
  optedOutNote: name === 'Rowan Stub' ? 'Opted out by replying STOP · Aug 31, 2026' : undefined,
}));

export const patientIdByName = (name: string) => PATIENTS.find((p) => p.name === name)?.id;
