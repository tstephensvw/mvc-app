/**
 * Zero-dependency binary builders — ported from CBS_Solar_Map_Interactive_DEMO.html
 * (proven in production on the engagement). Pure Uint8Array in/out: runs in the
 * browser AND in Node with no libraries. Do not "modernize" these into a zip/pdf
 * library dependency — one-click board-ready exports with no server round-trip
 * and no supply chain is the point.
 *
 *  - zip():       uncompressed ZIP writer (STORE + CRC32 table)
 *  - buildPDF():  minimal single-page PDF wrapping one JPEG
 *  - buildPPTX(): minimal PPTX (raw OOXML) with one PNG sized to a 16:9 slide
 */

const ENC = new TextEncoder();

export function cat(arrs: readonly Uint8Array[]): Uint8Array {
  let n = 0;
  for (const a of arrs) n += a.length;
  const o = new Uint8Array(n);
  let p = 0;
  for (const a of arrs) {
    o.set(a, p);
    p += a.length;
  }
  return o;
}

export function BYT(s: string): Uint8Array {
  return ENC.encode(s);
}

export function u16(n: number): Uint8Array {
  return new Uint8Array([n & 255, (n >> 8) & 255]);
}

export function u32(n: number): Uint8Array {
  return new Uint8Array([n & 255, (n >> 8) & 255, (n >> 16) & 255, (n >>> 24) & 255]);
}

const CRC_T = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();

export function crc32(b: Uint8Array): number {
  let c = 0xffffffff;
  for (let i = 0; i < b.length; i++) c = CRC_T[(c ^ b[i]!) & 255]! ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

export interface ZipEntry {
  name: string;
  data: Uint8Array;
}

/** Uncompressed (STORE) ZIP. */
export function zip(files: readonly ZipEntry[]): Uint8Array {
  const local: Uint8Array[] = [];
  const central: Uint8Array[] = [];
  let off = 0;
  for (const f of files) {
    const nm = BYT(f.name);
    const d = f.data;
    const crc = crc32(d);
    const lh = cat([u32(0x04034b50), u16(20), u16(0), u16(0), u16(0), u16(0), u32(crc), u32(d.length), u32(d.length), u16(nm.length), u16(0), nm]);
    local.push(lh, d);
    central.push(
      cat([
        u32(0x02014b50), u16(20), u16(20), u16(0), u16(0), u16(0), u16(0),
        u32(crc), u32(d.length), u32(d.length), u16(nm.length), u16(0), u16(0), u16(0), u16(0), u32(0), u32(off), nm,
      ]),
    );
    off += lh.length + d.length;
  }
  const cd = cat(central);
  const eocd = cat([u32(0x06054b50), u16(0), u16(0), u16(files.length), u16(files.length), u32(cd.length), u32(off), u16(0)]);
  return cat([...local, cd, eocd]);
}

/** Minimal single-page PDF: one JPEG image scaled to the page. */
export function buildPDF(jpg: Uint8Array, pxW: number, pxH: number, pageW: number, pageH: number): Uint8Array {
  const parts: Uint8Array[] = [];
  let len = 0;
  const off: number[] = [];
  const put = (s: string | Uint8Array) => {
    const b = s instanceof Uint8Array ? s : BYT(s);
    parts.push(b);
    len += b.length;
  };
  const obj = (n: number, body: string) => {
    off[n] = len;
    put(n + " 0 obj\n" + body + "\nendobj\n");
  };
  put("%PDF-1.4\n");
  obj(1, "<< /Type /Catalog /Pages 2 0 R >>");
  obj(2, "<< /Type /Pages /Kids [3 0 R] /Count 1 >>");
  obj(3, "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 " + pageW + " " + pageH + "] /Resources << /XObject << /Im0 4 0 R >> >> /Contents 5 0 R >>");
  off[4] = len;
  put(
    "4 0 obj\n<< /Type /XObject /Subtype /Image /Width " + pxW + " /Height " + pxH +
      " /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length " + jpg.length + " >>\nstream\n",
  );
  put(jpg);
  put("\nendstream\nendobj\n");
  const content = "q " + pageW + " 0 0 " + pageH + " 0 0 cm /Im0 Do Q";
  obj(5, "<< /Length " + content.length + " >>\nstream\n" + content + "\nendstream");
  const xrefStart = len;
  let x = "xref\n0 6\n0000000000 65535 f \n";
  for (let i = 1; i <= 5; i++) x += String(off[i]).padStart(10, "0") + " 00000 n \n";
  put(x);
  put("trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n" + xrefStart + "\n%%EOF");
  return cat(parts);
}

const A = 'xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"';
const R = 'xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"';
const P = 'xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main"';
const REL = "http://schemas.openxmlformats.org/officeDocument/2006/relationships";

function THEME(): string {
  const sc = (n: string, v: string) => "<a:" + n + '><a:srgbClr val="' + v + '"/></a:' + n + ">";
  const clr =
    '<a:clrScheme name="EY"><a:dk1><a:sysClr val="windowText" lastClr="000000"/></a:dk1><a:lt1><a:sysClr val="window" lastClr="FFFFFF"/></a:lt1>' +
    sc("dk2", "2E2E38") + sc("lt2", "F4F5F7") + sc("accent1", "27ACAA") + sc("accent2", "FFE600") + sc("accent3", "2DB757") +
    sc("accent4", "188CE5") + sc("accent5", "750E5C") + sc("accent6", "E0301E") + sc("hlink", "188CE5") + sc("folHlink", "750E5C") +
    "</a:clrScheme>";
  const font =
    '<a:fontScheme name="Arial"><a:majorFont><a:latin typeface="Arial"/><a:ea typeface=""/><a:cs typeface=""/></a:majorFont><a:minorFont><a:latin typeface="Arial"/><a:ea typeface=""/><a:cs typeface=""/></a:minorFont></a:fontScheme>';
  const solid = '<a:solidFill><a:schemeClr val="phClr"/></a:solidFill>';
  const line = '<a:ln w="9525" cap="flat" cmpd="sng" algn="ctr">' + solid + '<a:prstDash val="solid"/></a:ln>';
  const fmt =
    '<a:fmtScheme name="Office"><a:fillStyleLst>' + solid + solid + solid + "</a:fillStyleLst><a:lnStyleLst>" + line + line + line +
    "</a:lnStyleLst><a:effectStyleLst><a:effectStyle><a:effectLst/></a:effectStyle><a:effectStyle><a:effectLst/></a:effectStyle><a:effectStyle><a:effectLst/></a:effectStyle></a:effectStyleLst><a:bgFillStyleLst>" +
    solid + solid + solid + "</a:bgFillStyleLst></a:fmtScheme>";
  return "<a:theme " + A + ' name="EY"><a:themeElements>' + clr + font + fmt + "</a:themeElements><a:objectDefaults/><a:extraClrSchemeLst/></a:theme>";
}

/** Minimal one-slide PPTX (16:9) with the PNG centered and aspect-fit. */
export function buildPPTX(png: Uint8Array, pxW: number, pxH: number): Uint8Array {
  const SW = 12192000;
  const SH = 6858000;
  const ar = pxW / pxH;
  let cx = SH * ar;
  let cy = SH;
  if (cx > SW) {
    cx = SW;
    cy = SW / ar;
  }
  cx = Math.round(cx);
  cy = Math.round(cy);
  const ox = Math.round((SW - cx) / 2);
  const oy = Math.round((SH - cy) / 2);
  const xml = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n';
  const grp =
    '<p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr><p:grpSpPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/><a:chOff x="0" y="0"/><a:chExt cx="0" cy="0"/></a:xfrm></p:grpSpPr>';
  const files: ZipEntry[] = [
    {
      name: "[Content_Types].xml",
      data: BYT(
        xml +
          '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Default Extension="png" ContentType="image/png"/><Default Extension="jpeg" ContentType="image/jpeg"/><Override PartName="/ppt/presentation.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.presentation.main+xml"/><Override PartName="/ppt/slideMasters/slideMaster1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slideMaster+xml"/><Override PartName="/ppt/slideLayouts/slideLayout1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slideLayout+xml"/><Override PartName="/ppt/slides/slide1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slide+xml"/><Override PartName="/ppt/theme/theme1.xml" ContentType="application/vnd.openxmlformats-officedocument.theme+xml"/></Types>',
      ),
    },
    {
      name: "_rels/.rels",
      data: BYT(
        xml +
          '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="' + REL + '/officeDocument" Target="ppt/presentation.xml"/></Relationships>',
      ),
    },
    {
      name: "ppt/presentation.xml",
      data: BYT(
        xml +
          "<p:presentation " + A + " " + R + " " + P + '><p:sldMasterIdLst><p:sldMasterId id="2147483648" r:id="rId1"/></p:sldMasterIdLst><p:sldIdLst><p:sldId id="256" r:id="rId2"/></p:sldIdLst><p:sldSz cx="12192000" cy="6858000"/><p:notesSz cx="6858000" cy="9144000"/></p:presentation>',
      ),
    },
    {
      name: "ppt/_rels/presentation.xml.rels",
      data: BYT(
        xml +
          '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="' + REL + '/slideMaster" Target="slideMasters/slideMaster1.xml"/><Relationship Id="rId2" Type="' + REL + '/slide" Target="slides/slide1.xml"/><Relationship Id="rId3" Type="' + REL + '/theme" Target="theme/theme1.xml"/></Relationships>',
      ),
    },
    {
      name: "ppt/slideMasters/slideMaster1.xml",
      data: BYT(
        xml +
          "<p:sldMaster " + A + " " + R + " " + P + '><p:cSld><p:bg><p:bgRef idx="1001"><a:schemeClr val="bg1"/></p:bgRef></p:bg><p:spTree>' + grp + '</p:spTree></p:cSld><p:clrMap bg1="lt1" tx1="dk1" bg2="lt2" tx2="dk2" accent1="accent1" accent2="accent2" accent3="accent3" accent4="accent4" accent5="accent5" accent6="accent6" hlink="hlink" folHlink="folHlink"/><p:sldLayoutIdLst><p:sldLayoutId id="2147483649" r:id="rId1"/></p:sldLayoutIdLst><p:txStyles><p:titleStyle/><p:bodyStyle/><p:otherStyle/></p:txStyles></p:sldMaster>',
      ),
    },
    {
      name: "ppt/slideMasters/_rels/slideMaster1.xml.rels",
      data: BYT(
        xml +
          '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="' + REL + '/slideLayout" Target="../slideLayouts/slideLayout1.xml"/><Relationship Id="rId2" Type="' + REL + '/theme" Target="../theme/theme1.xml"/></Relationships>',
      ),
    },
    {
      name: "ppt/slideLayouts/slideLayout1.xml",
      data: BYT(
        xml +
          "<p:sldLayout " + A + " " + R + " " + P + ' type="blank" preserve="1"><p:cSld name="Blank"><p:spTree>' + grp + "</p:spTree></p:cSld><p:clrMapOvr><a:masterClrMapping/></p:clrMapOvr></p:sldLayout>",
      ),
    },
    {
      name: "ppt/slideLayouts/_rels/slideLayout1.xml.rels",
      data: BYT(
        xml +
          '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="' + REL + '/slideMaster" Target="../slideMasters/slideMaster1.xml"/></Relationships>',
      ),
    },
    {
      name: "ppt/slides/slide1.xml",
      data: BYT(
        xml +
          "<p:sld " + A + " " + R + " " + P + "><p:cSld><p:spTree>" + grp +
          '<p:pic><p:nvPicPr><p:cNvPr id="2" name="Solar Map"/><p:cNvPicPr><a:picLocks noChangeAspect="1"/></p:cNvPicPr><p:nvPr/></p:nvPicPr><p:blipFill><a:blip r:embed="rId1"/><a:stretch><a:fillRect/></a:stretch></p:blipFill><p:spPr><a:xfrm><a:off x="' +
          ox + '" y="' + oy + '"/><a:ext cx="' + cx + '" cy="' + cy + '"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></p:spPr></p:pic></p:spTree></p:cSld></p:sld>',
      ),
    },
    {
      name: "ppt/slides/_rels/slide1.xml.rels",
      data: BYT(
        xml +
          '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="' + REL + '/image" Target="../media/image1.png"/><Relationship Id="rId2" Type="' + REL + '/slideLayout" Target="../slideLayouts/slideLayout1.xml"/></Relationships>',
      ),
    },
    { name: "ppt/theme/theme1.xml", data: BYT(xml + THEME()) },
    { name: "ppt/media/image1.png", data: png },
  ];
  return zip(files);
}
