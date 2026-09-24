import { Link } from "react-router-dom";
import { MapPin, Phone } from "lucide-react";
import { useCafeContacts } from "@/hooks/useConfig";
import { usePublicLegalList } from "@/features/legal/api/useLegal";
import { formatPhoneDisplay, toTelHref } from "@/shared/lib/phone";

const FALLBACK_LEGAL_LINKS: { slug: string; title: string }[] = [
  { slug: "privacy", title: "Политика обработки персональных данных" },
  { slug: "offer", title: "Публичная оферта" },
  { slug: "delivery-info", title: "Информация о доставке и оплате" },
];

export default function Footer() {
  const { supportPhone, cafeAddress, workingHours } = useCafeContacts();
  const legalQuery = usePublicLegalList();
  const telHref = supportPhone ? toTelHref(supportPhone) : "";
  const phoneLabel = supportPhone ? formatPhoneDisplay(supportPhone) : "";
  const hasContacts = Boolean(workingHours || cafeAddress || telHref);

  const published = legalQuery.data?.items ?? [];
  const legalLinks =
    published.length > 0
      ? published.map((d) => ({ slug: d.slug, title: d.title }))
      : FALLBACK_LEGAL_LINKS;

  return (
    <footer className="border-t border-white/10 bg-grill text-white">
      <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-10 sm:px-6">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="font-[family-name:var(--font-display)] text-xl font-semibold text-mustard">
              2Brothers
            </p>
            <p className="mt-2 max-w-sm text-sm text-white/65">
              Шаурма на гриле. Онлайн-заказ, личный кабинет и горячая выдача.
            </p>
          </div>

          <div className="space-y-2 text-sm text-white/65">
            {workingHours ? <p>{workingHours}</p> : null}
            {cafeAddress ? (
              <p className="inline-flex max-w-xs items-start gap-2">
                <MapPin
                  className="mt-0.5 size-3.5 shrink-0 text-mustard"
                  aria-hidden
                />
                <span>{cafeAddress}</span>
              </p>
            ) : null}
            {telHref ? (
              <a
                href={telHref}
                className="inline-flex items-center gap-2 text-white/85 transition hover:text-mustard"
                title={`Позвонить ${phoneLabel}`}
              >
                <Phone className="size-3.5 shrink-0 text-mustard" aria-hidden />
                <span className="tabular-nums tracking-wide">{phoneLabel}</span>
              </a>
            ) : null}
            {!hasContacts ? (
              <p>Самовывоз и доставка по району</p>
            ) : (
              <p className="pt-1 text-white/45">
                Самовывоз и доставка по району
              </p>
            )}
          </div>
        </div>

        <nav
          aria-label="Юридические документы"
          className="flex flex-col gap-2 border-t border-white/10 pt-6 text-sm sm:flex-row sm:flex-wrap sm:gap-x-6 sm:gap-y-2"
        >
          {legalLinks.map((item) => (
            <Link
              key={item.slug}
              to={`/${item.slug}`}
              className="text-white/65 transition hover:text-mustard"
            >
              {item.title}
            </Link>
          ))}
        </nav>
      </div>
    </footer>
  );
}
