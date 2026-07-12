import { cx } from '../../utils/cx';

// Untitled UI surface card — white, hairline border, soft shadow.
export default function Card({ as: Tag = 'div', className, children, ...props }) {
  return (
    <Tag
      className={cx('bg-white rounded-xl border border-gray-200 shadow-xs', className)}
      {...props}
    >
      {children}
    </Tag>
  );
}
