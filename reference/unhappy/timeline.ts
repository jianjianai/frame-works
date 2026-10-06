import { beatAt } from "./draw";

/** Bar n starts at beat 4n (work time). Bar 8 = chorus, 16 = verse 2, 24 = outro. */
export const BAR = (n: number) => beatAt(n * 4);
export const END = 55.3;

/** Story events shared by the pictures and the sound effects (work time, seconds). */
export const EV = {
  // act 1 — the dog's view
  keys: 1.1,
  doorOpen: 1.45,
  doorClose: 2.6,
  roomDoor: 3.75,
  ballPush: 4.6,
  ballBack: 5.45,
  morningDoor: 9.6,
  slam: BAR(5) - 0.05,
  cough: 11.85,
  counter8: 12.05,
  squeak: 13.45,
  rainIn: 15.9,
  // act 2 — the rainy night
  toyDrop: 20.25,
  collapse: 25.75,
  flashlight: 26.95,
  shout: 27.7,
  clinicDoors: 29.9,
  xray: 30.81,
  slamCash: 32.35,
  // act 3 — his view
  keys2: 33.05,
  strokeAt: 35.2,
  swipe: 37.9,
  accept: 39.9,
  enough: 40.3,
  lightOff: 44.25,
  orDoor: 44.5,
  calendar0: 45.1,
  calendar1: 46.9,
  wake: 47.3,
  lick: 47.8,
  pat: 48.5,
};
