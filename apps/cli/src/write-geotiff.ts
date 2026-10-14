import { writeFileSync } from "node:fs";
import type { BoundingBox } from "../../../packages/domain/src/index.js";

const typeAscii = 2;
const typeShort = 3;
const typeLong = 4;
const typeDouble = 12;

export function writeGeotiff(
  path: string,
  values: ArrayLike<number>,
  width: number,
  height: number,
  bbox: BoundingBox,
  bits: 8 | 32,
  noData?: number,
): void {
  const bytesPerSample = bits / 8;
  const strip = Buffer.alloc(width * height * bytesPerSample);
  if (bits === 8) {
    for (let index = 0; index < values.length; index += 1) strip.writeUInt8(values[index] ?? 0, index);
  } else {
    for (let index = 0; index < values.length; index += 1) strip.writeFloatLE(values[index] ?? 0, index * 4);
  }
  const scale = Buffer.alloc(24);
  scale.writeDoubleLE((bbox.east - bbox.west) / width, 0);
  scale.writeDoubleLE((bbox.north - bbox.south) / height, 8);
  const tie = Buffer.alloc(48);
  tie.writeDoubleLE(bbox.west, 24);
  tie.writeDoubleLE(bbox.north, 32);
  const geoKeys = Buffer.alloc(32);
  const keys = [1, 1, 0, 3, 1024, 0, 1, 2, 1025, 0, 1, 1, 2048, 0, 1, 4326];
  keys.forEach((value, index) => geoKeys.writeUInt16LE(value, index * 2));

  const tags: Array<[number, number, number, number]> = [
    [256, typeLong, 1, width],
    [257, typeLong, 1, height],
    [258, typeShort, 1, bits],
    [259, typeShort, 1, 1],
    [262, typeShort, 1, 1],
    [273, typeLong, 1, 0],
    [277, typeShort, 1, 1],
    [278, typeLong, 1, height],
    [279, typeLong, 1, strip.length],
    [339, typeShort, 1, bits === 32 ? 3 : 1],
    [33550, typeDouble, 3, 0],
    [33922, typeDouble, 6, 0],
    [34735, typeShort, 16, 0],
  ];
  const noDataText = noData === undefined ? undefined : Buffer.from(`${noData}\0`, "ascii");
  if (noDataText) tags.push([42113, typeAscii, noDataText.length, 0]);

  const ifdSize = 2 + tags.length * 12 + 4;
  const headerSize = 8;
  let offset = headerSize + ifdSize;
  const noDataInline = noDataText !== undefined && noDataText.length <= 4;
  const extras = [scale, tie, geoKeys, strip, ...(noDataText && !noDataInline ? [noDataText] : [])];
  const extraOffsets = extras.map((buffer) => {
    const start = offset;
    offset += buffer.length;
    return start;
  });
  tags[5]![3] = extraOffsets[3]!;
  tags[10]![3] = extraOffsets[0]!;
  tags[11]![3] = extraOffsets[1]!;
  tags[12]![3] = extraOffsets[2]!;
  if (noDataText && !noDataInline) tags[13]![3] = extraOffsets[4]!;

  const header = Buffer.alloc(headerSize);
  header.write("II");
  header.writeUInt16LE(42, 2);
  header.writeUInt32LE(headerSize, 4);
  const ifd = Buffer.alloc(ifdSize);
  ifd.writeUInt16LE(tags.length, 0);
  tags.forEach((tag, index) => {
    const start = 2 + index * 12;
    ifd.writeUInt16LE(tag[0], start);
    ifd.writeUInt16LE(tag[1], start + 2);
    ifd.writeUInt32LE(tag[2], start + 4);
    if (tag[1] === typeAscii && noDataText && noDataInline) noDataText.copy(ifd, start + 8);
    else if (tag[1] === typeShort && tag[2] === 1) ifd.writeUInt16LE(tag[3], start + 8);
    else ifd.writeUInt32LE(tag[3], start + 8);
  });
  writeFileSync(path, Buffer.concat([header, ifd, ...extras]));
}
