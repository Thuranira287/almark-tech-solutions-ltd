import { useState } from "react";
import {
  Check,
  Copy,
  Facebook,
  Linkedin,
  MessageCircle,
  Share2,
  Twitter,
} from "lucide-react";

interface SocialShareProps {
  title: string;
  url?: string;
  description?: string;
  className?: string;
}

export default function SocialShare({
  title,
  url,
  description,
  className = "",
}: SocialShareProps) {
  const [copied, setCopied] = useState(false);

  const shareUrl =
    url || (typeof window !== "undefined" ? window.location.href : "");

  const encodedUrl = encodeURIComponent(shareUrl);
  const encodedTitle = encodeURIComponent(title);
  const encodedDescription = encodeURIComponent(
    description || `Check out ${title} from Almark Tech Solutions.`
  );

  const shareLinks = [
    {
      name: "WhatsApp",
      icon: MessageCircle,
      href: `https://wa.me/?text=${encodedTitle}%20${encodedUrl}`,
      className:
        "hover:bg-green-50 hover:text-green-600 dark:hover:bg-green-950/30",
    },
    {
      name: "Facebook",
      icon: Facebook,
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
      className:
        "hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-950/30",
    },
    {
      name: "X",
      icon: Twitter,
      href: `https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`,
      className:
        "hover:bg-gray-100 hover:text-gray-900 dark:hover:bg-gray-800",
    },
    {
      name: "LinkedIn",
      icon: Linkedin,
      href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
      className:
        "hover:bg-blue-50 hover:text-blue-700 dark:hover:bg-blue-950/30",
    },
  ];

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);

      setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch {
      const textArea = document.createElement("textarea");
      textArea.value = shareUrl;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);

      setCopied(true);

      setTimeout(() => {
        setCopied(false);
      }, 2000);
    }
  };

  const handleNativeShare = async () => {
    if (!navigator.share) return;

    try {
      await navigator.share({
        title,
        text: description || title,
        url: shareUrl,
      });
    } catch {
      // User cancelled the share dialog.
    }
  };

  return (
    <div
      className={`flex flex-wrap items-center gap-3 ${className}`}
      aria-label="Social sharing options"
    >
      <div className="flex items-center gap-2 text-sm font-medium text-gray-600 dark:text-gray-400">
        <Share2 className="h-4 w-4 text-brand-gold" aria-hidden="true" />
        <span>Share</span>
      </div>

      <div className="h-5 w-px bg-gray-200 dark:bg-gray-700" />

      <div className="flex flex-wrap items-center gap-2">
        {shareLinks.map((social) => {
          const Icon = social.icon;

          return (
            <a
              key={social.name}
              href={social.href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Share ${title} on ${social.name}`}
              title={`Share on ${social.name}`}
              className={`flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-600 transition-all duration-200 hover:-translate-y-0.5 hover:border-transparent dark:border-gray-700 dark:bg-gray-900 dark:text-gray-400 ${social.className}`}
            >
              <Icon className="h-4 w-4" aria-hidden="true" />
            </a>
          );
        })}

        <button
          type="button"
          onClick={handleCopy}
          aria-label={copied ? "Link copied" : "Copy link"}
          title={copied ? "Link copied" : "Copy link"}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-600 transition-all duration-200 hover:-translate-y-0.5 hover:border-brand-gold hover:text-brand-gold dark:border-gray-700 dark:bg-gray-900 dark:text-gray-400"
        >
          {copied ? (
            <Check className="h-4 w-4" aria-hidden="true" />
          ) : (
            <Copy className="h-4 w-4" aria-hidden="true" />
          )}
        </button>

        {"share" in navigator && (
          <button
            type="button"
            onClick={handleNativeShare}
            aria-label="Share using device"
            title="Share"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-600 transition-all duration-200 hover:-translate-y-0.5 hover:border-brand-gold hover:text-brand-gold dark:border-gray-700 dark:bg-gray-900 dark:text-gray-400"
          >
            <Share2 className="h-4 w-4" aria-hidden="true" />
          </button>
        )}
      </div>

      <span className="sr-only">{encodedDescription}</span>
    </div>
  );
}