import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="site-footer-inner">
        <div className="site-footer-grid">
          <div className="site-footer-copy">
            <strong>Crossing TCG</strong>
            <p>
              Wholesale portal
            </p>
          </div>

          <div className="site-footer-column">
            <span className="site-footer-heading">About Us</span>
            <nav aria-label="Footer company links" className="site-footer-links">
              <Link href="/about-us">About Us</Link>
              <Link href="/contact">Contact Us</Link>
              <Link href="/open-account">Open an Account</Link>
            </nav>
          </div>

          <div className="site-footer-column">
            <span className="site-footer-heading">Policies</span>
            <nav aria-label="Footer policy links" className="site-footer-links">
              <Link href="/privacy-policy">Privacy Policy</Link>
              <Link href="/terms-and-conditions">Terms &amp; Conditions</Link>
              <Link href="/terms-of-sale">Terms of Sale</Link>
            </nav>
          </div>

          <div className="site-footer-column">
            <span className="site-footer-heading">Social</span>
            <nav aria-label="Footer social links" className="site-footer-links">
              <a href="https://www.instagram.com/crossingcards" rel="noreferrer" target="_blank">
                Instagram
              </a>
              <a href="https://www.tiktok.com/@crossingcards" rel="noreferrer" target="_blank">
                TikTok
              </a>
            </nav>
          </div>
        </div>
      </div>

      <div className="site-footer-bottom">
        <div className="site-footer-bottom-inner">
          <span>Copyright @CrossingTCG 2026 All Rights Reserved</span>
        </div>
      </div>
    </footer>
  );
}
