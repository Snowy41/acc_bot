import { TAGS } from "./tags.config";

const defaultTag = {
  label: "",
  emoji: "",
  bg: "",
  textColor: "#fff",
  className: "",
  border: "",
  description: "",
};

export function TagSection({ tags = [] }: { tags: string[] }) {
  return (
    <div className="flex flex-wrap gap-2 justify-center">
      {tags.map((tag, idx) => {
        const conf = { ...defaultTag, ...(TAGS[tag] || { label: tag }) };
        return (
          <span
            key={tag + idx}
            className={`
              px-4 py-1 rounded-full font-semibold text-xs relative shadow-md
              bg-gradient-to-r ${conf.bg || "from-cyan-900 to-cyan-700"}
              ${conf.className}
              ${conf.border}
              group
              overflow-hidden
            `}
            style={{ color: conf.textColor }}
            title={conf.label}
          >
            {conf.emoji && <span className="mr-2">{conf.emoji}</span>}
            {conf.label}
          </span>
        );
      })}
    </div>
  );
}
