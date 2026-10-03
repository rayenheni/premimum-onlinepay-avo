import type { Metadata } from "next";
import { PromoVideo } from "@/components/promo-video";
import { getPublicSiteConfig } from "@/lib/site-config";
import { asLocale } from "@/lib/meta";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const locale = asLocale((await params).locale);
  return {
    title: locale === "ar" ? "فيديو ترويجي باللهجة التونسية | مكتبكم القانوني" : "Vidéo promotionnelle | Votre Cabinet",
    description: locale === "ar" ? "موشن غرافيك قصير يعرّف بخدمات مكتبكم القانوني في تونس." : "Un motion graphic court pour présenter Votre Cabinet à Tunis.",
  };
}

export default async function PromoPage({ params }: Props) {
  const locale = asLocale((await params).locale);
  const config = await getPublicSiteConfig();
  return <PromoVideo locale={locale} config={config} />;
}
