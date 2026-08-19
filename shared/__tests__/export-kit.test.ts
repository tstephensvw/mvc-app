import { describe, it, expect } from "vitest";
import { clean, escapeMD, csvRow, csvRowRaw, twoBlockCsv, makeExportSessionId } from "../export-kit/boundary.js";
import { crc32, zip, buildPDF, buildPPTX, BYT } from "../export-kit/binary.js";

describe("boundary hygiene (BO2 hardening contract)", () => {
  it("clean straightens smart quotes and collapses whitespace", () => {
    expect(clean("“Smart”    ‘quotes’")).toBe(`"Smart" 'quotes'`);
    expect(clean("  a \n b  ")).toBe("a b");
  });
  it("escapeMD escapes pipes", () => {
    expect(escapeMD("a | b")).toBe("a \\| b");
  });
  it("csvRow quotes and doubles embedded quotes; raw preserves value verbatim", () => {
    expect(csvRow(['he said "hi"', null])).toBe('"he said ""hi""",""');
    expect(csvRowRaw(["VERSION", "1"])).toBe('"VERSION","1"');
  });
  it("session id keeps the HTML-era format", () => {
    expect(makeExportSessionId("2026-08-19T10:00:00.000Z", "Tim Stephens")).toBe("2026-08-19T10-00-00-000Z_TimStephens");
    expect(makeExportSessionId("2026-08-19T10:00:00.000Z", "")).toBe("2026-08-19T10-00-00-000Z_unnamed");
  });
  it("two-block CSV layout: raw meta banner, log block, FINAL STATE banner, state block", () => {
    const csv = twoBlockCsv(
      { tool: "BO1-CBS", sessionId: "sid", sessionStart: "s", facilitator: "f", exportedAt: "e" },
      ["Seq", "Type"],
      [[1, "move"]],
      "--- FINAL STATE (CBS Prioritization sheet) ---",
      ["CBS", "Tier"],
      [["Inpatient Nursing Units", "4 – 24 Hours"]],
    );
    const lines = csv.split("\n");
    expect(lines[0]).toBe('"VERSION","1"');
    expect(lines[1]).toBe('"TOOL","BO1-CBS"');
    expect(csv).toContain('"--- FINAL STATE (CBS Prioritization sheet) ---"');
    expect(csv).toContain('"Inpatient Nursing Units","4 – 24 Hours"');
  });
});

describe("binary builders (Solar Map port)", () => {
  it("crc32 matches the reference vector", () => {
    expect(crc32(BYT("123456789"))).toBe(0xcbf43926);
  });

  it("zip produces a valid STORE archive with EOCD trailer", () => {
    const z = zip([{ name: "hello.txt", data: BYT("hello world") }]);
    // local file header signature PK\x03\x04
    expect([z[0], z[1], z[2], z[3]]).toEqual([0x50, 0x4b, 0x03, 0x04]);
    // EOCD signature PK\x05\x06 present in the trailer
    const tail = z.slice(-22);
    expect([tail[0], tail[1], tail[2], tail[3]]).toEqual([0x50, 0x4b, 0x05, 0x06]);
  });

  it("buildPDF wraps a JPEG payload in a parseable PDF skeleton", () => {
    const jpg = BYT("\xff\xd8fakejpeg\xff\xd9");
    const pdf = buildPDF(jpg, 100, 80, 1180, 940);
    const text = new TextDecoder("latin1").decode(pdf);
    expect(text.startsWith("%PDF-1.4")).toBe(true);
    expect(text).toContain("/Type /Catalog");
    expect(text).toContain("/Width 100 /Height 80");
    expect(text.trimEnd().endsWith("%%EOF")).toBe(true);
    // xref offsets must point at the object headers they index
    const xref = text.slice(text.indexOf("xref"));
    const offsets = [...xref.matchAll(/^(\d{10}) 00000 n /gm)].map((m) => parseInt(m[1]!, 10));
    expect(offsets.length).toBe(5);
    offsets.forEach((off, i) => {
      expect(text.slice(off, off + 8)).toContain(`${i + 1} 0 obj`);
    });
  });

  it("buildPPTX zips a complete OOXML part set with the image embedded", () => {
    const png = BYT("\x89PNGfake");
    const pptx = buildPPTX(png, 1600, 900);
    const text = new TextDecoder("latin1").decode(pptx);
    for (const part of [
      "[Content_Types].xml",
      "_rels/.rels",
      "ppt/presentation.xml",
      "ppt/slides/slide1.xml",
      "ppt/slides/_rels/slide1.xml.rels",
      "ppt/theme/theme1.xml",
      "ppt/media/image1.png",
    ]) {
      expect(text, `missing part ${part}`).toContain(part);
    }
    expect([pptx[0], pptx[1]]).toEqual([0x50, 0x4b]);
  });
});
