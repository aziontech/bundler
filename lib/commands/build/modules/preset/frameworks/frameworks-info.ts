// @ts-expect-error - Types are not properly exported
import { listFrameworks as netlifyListFrameworks } from '@netlify/framework-info';

export const listFrameworks = ({ projectDir = process.cwd() }: { projectDir: string }) => {
  return netlifyListFrameworks({
    projectDir,
  });
};

export default { listFrameworks };
