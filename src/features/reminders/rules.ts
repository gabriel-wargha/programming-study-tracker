import { addDays } from "@/lib/dates/weeks";

export const FIRST_REVIEW_AFTER_DAYS = 7;
export const SECOND_REVIEW_AFTER_DAYS = 30;

export const firstReviewDue = (today: string) => addDays(today, FIRST_REVIEW_AFTER_DAYS);
export const secondReviewDue = (today: string) => addDays(today, SECOND_REVIEW_AFTER_DAYS);
