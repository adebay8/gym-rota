import type React from 'react';

import { ProgramHelpers } from '../program/program.helpers.ts';
import type { Pictures } from '../program/program.types.ts';

/** Start and end positions side by side, so the movement reads at a glance. */
export function PicturePair({ pictures, name }: { readonly pictures: Pictures; readonly name: string }): React.JSX.Element {
  const [start, end] = ProgramHelpers.pictureUrls(pictures.folder);
  return (
    <figure className="m-0 flex flex-col gap-2">
      <div className="grid grid-cols-2 gap-2">
        {[
          { src: start, word: 'Start' },
          { src: end, word: 'Finish' },
        ].map((picture) => (
          <div key={picture.word} className="flex flex-col gap-1">
            {/* Plain img: the site is a static export and these are already small JPEGs. */}
            <img src={picture.src} alt={`${name}, ${picture.word.toLowerCase()} position`} loading="lazy" decoding="async" width={850} height={567} className="aspect-[3/2] w-full rounded-s bg-white object-contain" />
            <span className="text-caption text-faint">{picture.word}</span>
          </div>
        ))}
      </div>
      {pictures.note && <figcaption className="text-caption text-faint">{pictures.note}</figcaption>}
    </figure>
  );
}
