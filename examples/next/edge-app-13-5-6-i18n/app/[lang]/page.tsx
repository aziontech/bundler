import arData from "@/app/lang/ar";
import enData from "@/app/lang/en";
import frData from "@/app/lang/fr";

import { Inter } from "next/font/google";
import { DEFAULT_LOCALE, LOCALES } from "../lang/langs";

const inter = Inter({ subsets: ["latin"] });

export default async function Page({ params: { lang } }: any) {
  const { data, locales, defaultLocale }: any = await getLangData(lang);

  return (
    <div className={`bg-white p-4 ${inter.className}`}>
      <div className="flex flex-col items-center justify-center">
        <h2 className="text-5xl font-medium text-gray-900">
          getServerSideProps page
        </h2>
        <p className="mt-5 text-gray-600">
          <b>Current locale:</b> {lang}
        </p>
        <p className="mt-5 text-gray-600">
          <b>Default locale:</b> {defaultLocale}
        </p>
        <p className="mt-5 text-gray-600">
          <b>Configured locales:</b> {JSON.stringify(locales)}
        </p>

        <div className="mt-5">
          <h3 className="text-3xl font-medium text-gray-900">{data.title}</h3>
          <p className="mt-5 text-gray-600">{data.description}</p>
        </div>

        <div className="mt-10 text-blue-500 hover:text-blue-800 hover:underline active:text-blue-800">
          <a href="/fr">Go French page</a>
        </div>

        <div className="mt-5 text-blue-500 hover:text-blue-800 hover:underline active:text-blue-800">
          <a href="/ar">Go to Arabic Page</a>
        </div>

        <div className="mt-5 text-blue-500 hover:text-blue-800 hover:underline active:text-blue-800">
          <a href="/en">Go to English Page</a>
        </div>

        <div className="mt-5 text-blue-500 hover:text-blue-800 hover:underline active:text-blue-800">
          <a href="/ar/api/hello">Go to Arabic Edge Api route</a>
        </div>
      </div>
    </div>
  );
}

const getLangData = async (lang: string) => {
  let data: LangData;
  const locales = LOCALES;
  const defaultLocale = DEFAULT_LOCALE;
  switch (lang) {
    case "ar":
      data = arData;
      break;
    case "fr":
      data = frData;
      break;
    default:
      data = enData;
      break;
  }

  return {
    data,
    locales,
    defaultLocale,
  };
};

export const runtime = "edge";
