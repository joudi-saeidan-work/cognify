import {
  isValidHour,
  isValid12Hour,
  isValidMinuteOrSecond,
  getValidNumber,
  getValidHour,
  getValid12Hour,
  getValidMinuteOrSecond,
  getValidArrowNumber,
  getValidArrowHour,
  getValidArrow12Hour,
  getValidArrowMinuteOrSecond,
  setMinutes,
  setSeconds,
  setHours,
  set12Hours,
  setDateByType,
  getDateByType,
  getArrowByType,
  convert12HourTo24Hour,
  display12HourValue,
  type Period,
  type TimePickerType,
} from "@/app/(platform)/(dashboard)/board/[boardId]/_components/(date-time-picker)/time-picker-utils";

// Mock console methods to prevent warnings in test output
beforeAll(() => {
  jest.spyOn(console, "error").mockImplementation(() => {});
  jest.spyOn(console, "log").mockImplementation(() => {});
});

afterAll(() => {
  jest.restoreAllMocks();
});

describe("Time Picker Utils", () => {
  describe("Validation Functions", () => {
    describe("isValidHour", () => {
      it("returns true for valid hours (00-23)", () => {
        expect(isValidHour("00")).toBe(true);
        expect(isValidHour("01")).toBe(true);
        expect(isValidHour("12")).toBe(true);
        expect(isValidHour("23")).toBe(true);
      });

      it("returns false for invalid hours", () => {
        expect(isValidHour("24")).toBe(false);
        expect(isValidHour("-1")).toBe(false);
        expect(isValidHour("1")).toBe(false); // Single digit
        expect(isValidHour("abc")).toBe(false);
      });
    });

    describe("isValid12Hour", () => {
      it("returns true for valid 12-hour format (01-12)", () => {
        expect(isValid12Hour("01")).toBe(true);
        expect(isValid12Hour("06")).toBe(true);
        expect(isValid12Hour("12")).toBe(true);
      });

      it("returns false for invalid 12-hour format", () => {
        expect(isValid12Hour("00")).toBe(false); // 00 is not valid in 12-hour format
        expect(isValid12Hour("13")).toBe(false);
        expect(isValid12Hour("1")).toBe(false); // Single digit
        expect(isValid12Hour("abc")).toBe(false);
      });
    });

    describe("isValidMinuteOrSecond", () => {
      it("returns true for valid minutes/seconds (00-59)", () => {
        expect(isValidMinuteOrSecond("00")).toBe(true);
        expect(isValidMinuteOrSecond("30")).toBe(true);
        expect(isValidMinuteOrSecond("59")).toBe(true);
      });

      it("returns false for invalid minutes/seconds", () => {
        expect(isValidMinuteOrSecond("60")).toBe(false);
        expect(isValidMinuteOrSecond("-1")).toBe(false);
        expect(isValidMinuteOrSecond("5")).toBe(false); // Single digit
        expect(isValidMinuteOrSecond("abc")).toBe(false);
      });
    });
  });

  describe("Number Validation & Correction Functions", () => {
    describe("getValidNumber", () => {
      it("clamps values within range when not looping", () => {
        expect(getValidNumber("5", { max: 10, min: 0 })).toBe("05");
        expect(getValidNumber("15", { max: 10, min: 0 })).toBe("10"); // Clamped to max
        expect(getValidNumber("-5", { max: 10, min: 0 })).toBe("00"); // Clamped to min
      });

      it("loops values when loop=true", () => {
        expect(getValidNumber("15", { max: 10, min: 0, loop: true })).toBe(
          "00"
        ); // Loops to min
        expect(getValidNumber("-5", { max: 10, min: 0, loop: true })).toBe(
          "10"
        ); // Loops to max
      });

      it("handles non-numeric input", () => {
        expect(getValidNumber("abc", { max: 10 })).toBe("00");
      });

      it("pads single digit numbers with leading zero", () => {
        expect(getValidNumber("5", { max: 10 })).toBe("05");
      });
    });

    describe("getValidHour", () => {
      it("returns valid hour directly if already valid", () => {
        expect(getValidHour("05")).toBe("05");
        expect(getValidHour("23")).toBe("23");
      });

      it("corrects invalid hours", () => {
        expect(getValidHour("25")).toBe("23"); // Clamped to max
        expect(getValidHour("-1")).toBe("00"); // Clamped to min
        expect(getValidHour("abc")).toBe("00"); // Non-numeric input
      });
    });

    describe("getValid12Hour", () => {
      it("returns valid 12-hour directly if already valid", () => {
        expect(getValid12Hour("01")).toBe("01");
        expect(getValid12Hour("12")).toBe("12");
      });

      it("corrects invalid 12-hour values", () => {
        expect(getValid12Hour("13")).toBe("12"); // Clamped to max
        expect(getValid12Hour("00")).toBe("01"); // Clamped to min
        expect(getValid12Hour("abc")).toBe("00"); // Non-numeric input
      });
    });

    describe("getValidMinuteOrSecond", () => {
      it("returns valid minute/second directly if already valid", () => {
        expect(getValidMinuteOrSecond("00")).toBe("00");
        expect(getValidMinuteOrSecond("30")).toBe("30");
        expect(getValidMinuteOrSecond("59")).toBe("59");
      });

      it("corrects invalid minute/second values", () => {
        expect(getValidMinuteOrSecond("60")).toBe("59"); // Clamped to max
        expect(getValidMinuteOrSecond("-1")).toBe("00"); // Clamped to min
        expect(getValidMinuteOrSecond("abc")).toBe("00"); // Non-numeric input
      });
    });
  });

  describe("Arrow Navigation Functions", () => {
    describe("getValidArrowNumber", () => {
      it("increments and loops values", () => {
        expect(getValidArrowNumber("58", { min: 0, max: 59, step: 1 })).toBe(
          "59"
        );
        expect(getValidArrowNumber("59", { min: 0, max: 59, step: 1 })).toBe(
          "00"
        ); // Loops to min
        expect(getValidArrowNumber("00", { min: 0, max: 59, step: -1 })).toBe(
          "59"
        ); // Loops to max when going backwards
      });

      it("handles non-numeric input", () => {
        expect(getValidArrowNumber("abc", { min: 0, max: 59, step: 1 })).toBe(
          "00"
        );
      });
    });

    describe("getValidArrowHour", () => {
      it("increments hours correctly", () => {
        expect(getValidArrowHour("22", 1)).toBe("23");
        expect(getValidArrowHour("23", 1)).toBe("00"); // Loops to min
        expect(getValidArrowHour("00", -1)).toBe("23"); // Loops to max when going backwards
      });
    });

    describe("getValidArrow12Hour", () => {
      it("increments 12-hour format correctly", () => {
        expect(getValidArrow12Hour("11", 1)).toBe("12");
        expect(getValidArrow12Hour("12", 1)).toBe("01"); // Loops to min
        expect(getValidArrow12Hour("01", -1)).toBe("12"); // Loops to max when going backwards
      });
    });

    describe("getValidArrowMinuteOrSecond", () => {
      it("increments minutes/seconds correctly", () => {
        expect(getValidArrowMinuteOrSecond("58", 1)).toBe("59");
        expect(getValidArrowMinuteOrSecond("59", 1)).toBe("00"); // Loops to min
        expect(getValidArrowMinuteOrSecond("00", -1)).toBe("59"); // Loops to max when going backwards
      });
    });
  });

  describe("Date Modification Functions", () => {
    describe("setMinutes", () => {
      it("sets minutes on a Date object", () => {
        const date = new Date(2023, 0, 1, 12, 0, 0);
        const result = setMinutes(date, "30");
        expect(result.getMinutes()).toBe(30);
      });

      it("handles invalid minute values", () => {
        const date = new Date(2023, 0, 1, 12, 0, 0);
        const result = setMinutes(date, "65");
        expect(result.getMinutes()).toBe(59); // Clamped to max
      });
    });

    describe("setSeconds", () => {
      it("sets seconds on a Date object", () => {
        const date = new Date(2023, 0, 1, 12, 0, 0);
        const result = setSeconds(date, "30");
        expect(result.getSeconds()).toBe(30);
      });

      it("handles invalid second values", () => {
        const date = new Date(2023, 0, 1, 12, 0, 0);
        const result = setSeconds(date, "65");
        expect(result.getSeconds()).toBe(59); // Clamped to max
      });
    });

    describe("setHours", () => {
      it("sets hours on a Date object", () => {
        const date = new Date(2023, 0, 1, 12, 0, 0);
        const result = setHours(date, "15");
        expect(result.getHours()).toBe(15);
      });

      it("handles invalid hour values", () => {
        const date = new Date(2023, 0, 1, 12, 0, 0);
        const result = setHours(date, "25");
        expect(result.getHours()).toBe(23); // Clamped to max
      });
    });

    describe("set12Hours", () => {
      it("sets hours in 12-hour format on a Date object", () => {
        const date = new Date(2023, 0, 1, 0, 0, 0);

        // 03:00 AM
        let result = set12Hours(date, "03", "AM");
        expect(result.getHours()).toBe(3);

        // 03:00 PM
        result = set12Hours(date, "03", "PM");
        expect(result.getHours()).toBe(15);

        // 12:00 AM (midnight)
        result = set12Hours(date, "12", "AM");
        expect(result.getHours()).toBe(0);

        // 12:00 PM (noon)
        result = set12Hours(date, "12", "PM");
        expect(result.getHours()).toBe(12);
      });
    });

    describe("setDateByType", () => {
      it("sets different time parts based on type", () => {
        const date = new Date(2023, 0, 1, 12, 0, 0);

        expect(setDateByType(date, "15", "hours").getHours()).toBe(15);
        expect(setDateByType(date, "30", "minutes").getMinutes()).toBe(30);
        expect(setDateByType(date, "45", "seconds").getSeconds()).toBe(45);
        expect(setDateByType(date, "03", "12hours", "PM").getHours()).toBe(15);
      });

      it("handles missing period for 12hours type", () => {
        const date = new Date(2023, 0, 1, 12, 0, 0);
        const result = setDateByType(date, "03", "12hours");
        expect(result).toEqual(date); // Should return date unchanged
      });
    });

    describe("getDateByType", () => {
      it("gets different time parts based on type", () => {
        const date = new Date(2023, 0, 1, 15, 30, 45);

        expect(getDateByType(date, "hours")).toBe("15");
        expect(getDateByType(date, "minutes")).toBe("30");
        expect(getDateByType(date, "seconds")).toBe("45");
        expect(getDateByType(date, "12hours")).toBe("03");

        // Midnight case
        const midnight = new Date(2023, 0, 1, 0, 0, 0);
        expect(getDateByType(midnight, "12hours")).toBe("12");

        // Noon case
        const noon = new Date(2023, 0, 1, 12, 0, 0);
        expect(getDateByType(noon, "12hours")).toBe("12");
      });

      it("handles invalid type", () => {
        const date = new Date(2023, 0, 1, 15, 30, 45);
        expect(getDateByType(date, "invalid" as TimePickerType)).toBe("00");
      });
    });

    describe("getArrowByType", () => {
      it("performs arrow increment based on type", () => {
        expect(getArrowByType("14", 1, "hours")).toBe("15");
        expect(getArrowByType("58", 1, "minutes")).toBe("59");
        expect(getArrowByType("58", 1, "seconds")).toBe("59");
        expect(getArrowByType("11", 1, "12hours")).toBe("12");
      });

      it("handles invalid type", () => {
        expect(getArrowByType("12", 1, "invalid" as TimePickerType)).toBe("00");
      });
    });
  });

  describe("12-Hour Format Conversion Functions", () => {
    describe("convert12HourTo24Hour", () => {
      it("converts AM times correctly", () => {
        expect(convert12HourTo24Hour(1, "AM")).toBe(1);
        expect(convert12HourTo24Hour(11, "AM")).toBe(11);
        expect(convert12HourTo24Hour(12, "AM")).toBe(0); // 12 AM is midnight (00:00)
      });

      it("converts PM times correctly", () => {
        expect(convert12HourTo24Hour(1, "PM")).toBe(13);
        expect(convert12HourTo24Hour(11, "PM")).toBe(23);
        expect(convert12HourTo24Hour(12, "PM")).toBe(12); // 12 PM is noon
      });
    });

    describe("display12HourValue", () => {
      it("converts 24-hour to 12-hour display format", () => {
        // AM hours
        expect(display12HourValue(0)).toBe("12"); // Midnight
        expect(display12HourValue(1)).toBe("01");
        expect(display12HourValue(9)).toBe("09");
        expect(display12HourValue(11)).toBe("11");

        // PM hours
        expect(display12HourValue(12)).toBe("12"); // Noon
        expect(display12HourValue(13)).toBe("01");
        expect(display12HourValue(21)).toBe("09");
        expect(display12HourValue(23)).toBe("11");
      });

      it("handles special cases", () => {
        expect(display12HourValue(0)).toBe("12"); // Midnight
        expect(display12HourValue(12)).toBe("12"); // Noon
        expect(display12HourValue(22)).toBe("10"); // 10 PM
        expect(display12HourValue(23)).toBe("11"); // 11 PM
      });
    });
  });
});
