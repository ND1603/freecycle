import { CATEGORY_COLORS } from '../data/constants';

export default function CategoryTag({ category }) {
  const color = CATEGORY_COLORS[category] || CATEGORY_COLORS.Other;
  return (
    <span className="category-tag" style={{ '--tag-color': color }}>
      {category}
    </span>
  );
}
