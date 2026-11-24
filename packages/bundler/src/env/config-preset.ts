import type { PresetInput } from '@aziontech/config';

/** The name of a preset given as a name (string) or as a preset object */
const presetName = (preset: PresetInput | undefined | null): string | undefined =>
  typeof preset === 'string' ? preset : preset?.metadata?.name;

/**
 * Checks that `--preset` agrees with the `build.preset` of the azion.config.
 * Both are used to pick the preset (the flag wins), but a flag that points to another preset than the one the
 * azion.config was written for (e.g. `--preset astro` in a project configured for `vue`) makes the preset fill
 * directories that the azion.config does not point to, so the build fails far from the cause.
 *
 * @throws {Error} When the flag and the azion.config declare different presets.
 */
export const assertPresetMatchesConfig = ({
  flag,
  config,
}: {
  flag?: PresetInput | null;
  config?: { build?: { preset?: PresetInput } } | null;
}): void => {
  const fromFlag = presetName(flag);
  const fromFile = presetName(config?.build?.preset);

  if (fromFlag && fromFile && fromFlag !== fromFile) {
    throw new Error(
      `Conflicting presets: --preset is "${fromFlag}" but azion.config declares build.preset "${fromFile}". ` +
        'Remove the flag or update the "build.preset" field of your azion.config.',
    );
  }
};
