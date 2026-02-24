export type SearchItem = {
    title: string;
    summary: string;
    href: string;
    tags?: string[];
  };
  
  export const SEARCH_INDEX: SearchItem[] = [
    // Calculators
    { title: "Ohm’s Law Calculator", summary: "Solve V, I, or R.", href: "/reference/ohms-chart", tags: ["ohms", "voltage", "current", "resistance"] },
    { title: "Power Calculator", summary: "Watts from V × I.", href: "/calculators/power", tags: ["power", "watts"] },
    { title: "Voltage Drop (Single Phase)", summary: "Compute VD using I, length, and Ω/1000ft.", href: "/calculators/voltage-drop", tags: ["voltage drop", "vd"] },
  
    // Reference pages
    { title: "Quick Reference", summary: "Common formulas + rules of thumb.", href: "/reference/quick", tags: ["formulas", "rules"] },
    { title: "Conduit Bending", summary: "Multipliers, offsets, saddles, stub-ups.", href: "/reference/conduit", tags: ["conduit", "bending", "offset"] },
    { title: "Conduit Fill", summary: "NEC-based fill workflow + table import area.", href: "/reference/fill", tags: ["conduit fill", "chapter 9"] },
    { title: "Ampacity", summary: "NEC-based ampacity workflow + corrections.", href: "/reference/ampacity", tags: ["ampacity", "310", "correction", "adjustment"] },
    { title: "Box Fill", summary: "NEC 314.16 workflow + quick calculator.", href: "/reference/box-fill", tags: ["box fill", "314.16"] },
    { title: "NEC Tables", summary: "Searchable tables module (import-ready).", href: "/reference/tables", tags: ["NEC", "tables", "chapter 9", "310", "314.16"] },
  
    // New chart page
    { title: "Ohm’s Law Chart", summary: "Visual chart + quick solve paths.", href: "/reference/ohms-chart", tags: ["ohms chart", "wheel"] },
  ];