/**
 * Rótulos de marca con las mismas letras que el cartel de normas del local.
 *
 * La tipografía del cartel no está disponible (ninguna gratuita coincide),
 * así que "LACLAVE981" y "NORMAS" están dibujados como SVG midiendo el
 * cartel píxel a píxel: trazos rectos, esquinas cortadas solo donde las
 * tiene el cartel, la A de techo plano, la V recta y el 1 con base. Usan `currentColor` y se dimensionan con la altura, p. ej.
 * className="h-6 w-auto".
 */

export const LaClaveWordmark = ({ className = "h-6 w-auto", decorative = false }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 1081.0 100"
    fill="currentColor"
    fillRule="evenodd"
    className={className}
    role={decorative ? undefined : "img"}
    aria-label={decorative ? undefined : "LaClave981"}
    aria-hidden={decorative ? true : undefined}
  >
    <path d="M0 0L25 0L25 75L96 75L96 100L0 100ZM127 0L195 0L211 16L211 100L186 100L186 75L136 75L136 100L111 100L111 16ZM136 25L186 25L186 50L136 50ZM239 0L314 0L322 8L322 37L301 37L301 25L251 25L251 75L301 75L301 66L322 66L322 92L314 100L236 100L226 90L226 13ZM337 0L362 0L362 75L433 75L433 100L337 100ZM464 0L532 0L548 16L548 100L523 100L523 75L473 75L473 100L448 100L448 16ZM473 25L523 25L523 50L473 50ZM563 0L592 0L619 70L646 0L675 0L633 100L605 100ZM694 0L782 0L782 25L715 25L715 40L765 40L765 62L715 62L715 75L782 75L782 100L690 100L690 4ZM812 0L885 0L893 8L893 92L885 100L810 100L797 87L797 71L822 71L822 75L868 75L868 62L809 62L797 50L797 15ZM822 25L868 25L868 42L822 42ZM921 0L991 0L1004 13L1004 46L1000 50L1004 54L1004 87L991 100L921 100L908 87L908 54L912 50L908 46L908 13ZM933 25L979 25L979 42L933 42ZM933 62L979 62L979 79L933 79ZM1036 0L1065 0L1065 79L1081 79L1081 100L1019 100L1019 79L1040 79L1040 29L1019 29L1019 13Z" />
  </svg>
);

export const NormasWordmark = ({ className = "h-20 w-auto", decorative = false }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 655.2 100"
    fill="currentColor"
    fillRule="evenodd"
    className={className}
    role={decorative ? undefined : "img"}
    aria-label={decorative ? undefined : "Normas"}
    aria-hidden={decorative ? true : undefined}
  >
    <path d="M0 0L26.2 0L72.1 57.4L72.1 0L97.5 0L97.5 100L73.8 100L23.8 35.2L23.8 100L0 100ZM125.3 0L193.3 0L208.1 14.8L208.1 85.2L193.3 100L125.3 100L110.5 85.2L110.5 14.8ZM134.3 23L184.3 23L184.3 77.9L134.3 77.9ZM221.1 0L302.2 0L317 14.8L317 50.8L302.2 68.9L320.3 100L294.9 100L275.2 68.9L244.9 68.9L244.9 100L221.1 100ZM245.7 23L292.4 23L292.4 44.3L245.7 44.3ZM333.3 0L358.7 0L391.5 50.8L424.2 0L449.7 0L449.7 100L425.9 100L425.9 40.2L398.8 84.4L384.1 84.4L357 40.2L357 100L333.3 100ZM477.4 0L538.9 0L553.6 14.8L553.6 100L529.9 100L529.9 71.3L486.4 71.3L486.4 100L462.7 100L462.7 14.8ZM486.4 23L529.9 23L529.9 46.7L486.4 46.7ZM580.6 0L641.2 0L655.2 13.9L655.2 30.3L631.4 30.3L631.4 23L589.6 23L589.6 38.5L642.9 38.5L655.2 50.8L655.2 86.1L641.2 100L580.6 100L566.6 86.1L566.6 69.7L589.6 69.7L589.6 77.9L631.4 77.9L631.4 63.1L582.2 63.1L566.6 47.5L566.6 13.9Z" />
  </svg>
);
