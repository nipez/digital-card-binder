import sharp from "sharp";

const [, , input, output, leftArg, topArg, widthArg, heightArg] = process.argv;

if (!input || !output || !leftArg || !topArg || !widthArg || !heightArg) {
  console.error("Usage: npm run process-scan -- <input> <output> <left> <top> <width> <height>");
  process.exit(1);
}

const crop = {
  left: Number(leftArg),
  top: Number(topArg),
  width: Number(widthArg),
  height: Number(heightArg)
};

if (Object.values(crop).some((value) => !Number.isFinite(value))) {
  console.error("Crop values must be numbers.");
  process.exit(1);
}

await sharp(input)
  .rotate()
  .extract(crop)
  .resize(750, 1050, {
    fit: "fill"
  })
  .sharpen({ sigma: 0.5 })
  .webp({ quality: 88 })
  .toFile(output);

console.log(`Processed ${output}`);
