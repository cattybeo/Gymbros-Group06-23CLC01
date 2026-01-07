# EPIC: Experience Refinement & Scheduling Logic (v1.3.1 - Emerald)

## Overview

This epic focuses on closing critical UX gaps and technical debt identified in the **Classes - Booking** and **Journey** flows. The primary goals are to empower users with self-service schedule management (cancellations), prevent logical booking errors (overlaps), and improve the reliability of membership-date validation.

---

## 1. Objectives

- **Empower Users**: Enable booking cancellations directly from the UI.
- **Data Integrity**: Prevent overlapping class schedules and fix membership-to-class-date validation.
- **Real-time Awareness**: Transition to real-time slot tracking (Supabase Realtime).
- **Premium UX**: Implement Optimistic UI updates to provide near-instant feedback.

---

## 2. Technical Requirements

- **Cancel Logic**: Implement `DELETE` operations on the `bookings` table via `handleCancel` in `classes.tsx`.
- **Overlap Logic**: Modify `handleBook` to query existing bookings within the same time window.
- **Enhanced Validation**: Ensure membership `end_date` is compared against the specific `class.start_time`, not the current system time.
- **Supabase Realtime**: Initialize a channel for the `bookings` table to sync `classCounts` across all clients.

---

## 3. Task Breakdown

### 🟢 Priority 1: Cancellation & Interaction (The "Schedule Management" Module)

- [ ] **Task 1.1**: Refactor `ClassCard.tsx` to support a "Cancel" action when `isBooked` is true.
- [ ] **Task 1.2**: Implement `handleCancel` in `app/(tabs)/classes.tsx` (Supabase `DELETE`).
- [ ] **Task 1.3**: Propagate `handleCancel` through `LiveClassList.tsx`.

### 🟡 Priority 2: Logic & Safety (The "Guardrails" Module)

- [ ] **Task 2.1**: Implement "Overlap Detection" in the booking flow (Check for conflicting `start_time` and `end_time` in existing confirmed bookings).
- [ ] **Task 2.2**: Update Membership validation to use `class.start_time` as the reference date instead of `now`.

### 🔵 Priority 3: Real-time & Optimization (The "Fluidity" Module)

- [ ] **Task 3.1**: Integrate Supabase Realtime in `app/(tabs)/classes.tsx` to auto-update `classes` slot counts based on global booking changes.
- [ ] **Task 3.2**: Implement **Optimistic UI** for the Booking status (Update local `myBookings` Set instantly while API call is pending).

---

## 4. Acceptance Criteria

1. User can cancel a class and see slots increment immediately.
2. User is blocked from booking two classes that overlap in time.
3. User with a membership expiring tomorrow CANNOT book a class scheduled for next week.
4. UI updates instantly when "Book" is pressed without waiting for the spinner.

---

## 5. Risk Assessment

- **Real-time Loop**: Ensure Realtime subscriptions are properly cleaned up on component unmount to prevent memory leaks and excessive Supabase quota usage.
- **Race Conditions**: Optimistic UI must handle API failures by rolling back the state gracefully.
