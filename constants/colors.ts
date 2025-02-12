// use hex coes instead of tailwind so they don't get overriden in dark mode

const coverImageOptions = [
  // Gradient 1: Diagonal (Deep Navy to Light Gray)

  {
    background: "bg-gradient-to-br from-[#2A3950] to-[#E6E6E6]", // Explicit hex codes
  },
  // Gradient 2: Vertical (Off-White to Light Gray)

  {
    background: "bg-gradient-to-b from-[#F5F5F5] to-[#E6E6E6]",
  },
  // Gradient 3: Radial (Teal to Blue)

  {
    background:
      "bg-[radial-gradient(circle_at_center,#6EE7B7_0%,#3B82F6_100%)]",
  },
  // Gradient 4: Diagonal (Pink to Yellow)

  {
    background: "bg-gradient-to-br from-[#F472B6] to-[#FBBF24]",
  },
  // Gradient 5: Diagonal (Purple to Pink)

  {
    background: "bg-gradient-to-br from-[#9333EA] to-[#EC4899]",
  },
  // Gradient 6: Diagonal (Green to Blue)

  {
    background: "bg-gradient-to-br from-[#34D399] to-[#3B82F6]",
  },
  // Solid Color 1: Blue

  {
    background: "bg-[#3B82F6]", // Explicit hex code
  },
  // Solid Color 2: Red

  {
    background: "bg-[#EF4444]",
  },
  // Solid Color 3: Yellow

  {
    background: "bg-[#FBBF24]",
  },
  // Solid Color 4: Beige

  {
    background: "bg-[#F5F5DC]",
  },
  // Gradient 7: Diagonal (Orange to Purple)

  {
    background: "bg-gradient-to-br from-[#FB923C] to-[#9333EA]",
  },

  // New lighter solid colors (matching your list/board palette)
  {
    background: "bg-[#FDE8E8]", // Light Pink
  },
  {
    background: "bg-[#FEF3DC]", // Light Peach
  },
  {
    background: "bg-[#FFF9D5]", // Light Yellow
  },
  {
    background: "bg-[#D6F8D6]", // Light Green
  },
  {
    background: "bg-[#D7F2F8]", // Light Blue
  },
  {
    background: "bg-[#DEE8FA]", // Light Lavender
  },
  {
    background: "bg-[#E9DFF9]", // Light Purple
  },
  {
    background: "bg-[#EAEAEA]", // Light Gray
  },
  {
    background: "bg-[#FCD4D4]", // Light Coral
  },
  {
    background: "bg-[#FDEAC5]", // Light Apricot
  },
  {
    background: "bg-[#FFF4B8]", // Light Gold
  },
  {
    background: "bg-[#C8F3C8]", // Light Mint
  },
  {
    background: "bg-[#C7EDF5]", // Light Sky Blue
  },
  {
    background: "bg-[#C9E3F5]", // Light Periwinkle
  },
  {
    background: "bg-[#E4D6F6]", // Light Lilac
  },
  {
    background: "bg-[#E7E7E7]", // Light Silver
  },

  // New lighter gradients (inspired by your palette)
  {
    background: "bg-gradient-to-br from-[#FDE8E8] to-[#F6B7B7]", // Pink Gradient
  },
  {
    background: "bg-gradient-to-br from-[#FEF3DC] to-[#F9CF8E]", // Peach Gradient
  },
  {
    background: "bg-gradient-to-br from-[#FFF9D5] to-[#FAE587]", // Yellow Gradient
  },
  {
    background: "bg-gradient-to-br from-[#D6F8D6] to-[#94DA94]", // Green Gradient
  },
  {
    background: "bg-gradient-to-br from-[#D7F2F8] to-[#8AC9DA]", // Blue Gradient
  },
  {
    background: "bg-gradient-to-br from-[#DEE8FA] to-[#A4B8F2]", // Lavender Gradient
  },
  {
    background: "bg-gradient-to-br from-[#E9DFF9] to-[#C7A6F2]", // Purple Gradient
  },
  {
    background: "bg-gradient-to-br from-[#EAEAEA] to-[#B3B3B3]", // Gray Gradient
  },
];
