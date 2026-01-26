'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Box, Text, Tooltip } from '@radix-ui/themes';
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronDownIcon,
} from '@radix-ui/react-icons';
import type { NavItem, NavSection, SideNavProps } from './types';
import styles from './SideNav.module.scss';

const isNavSection = (item: NavItem | NavSection): item is NavSection => {
  return 'items' in item && !('id' in item);
};

const isSectionArray = (
  items: NavItem[] | NavSection[],
): items is NavSection[] => {
  return items.length > 0 && isNavSection(items[0]);
};

interface NavItemComponentProps {
  item: NavItem;
  collapsed: boolean;
  depth?: number;
}

const NavItemComponent = ({
  item,
  collapsed,
  depth = 0,
}: NavItemComponentProps) => {
  const pathname = usePathname();
  const [isExpanded, setIsExpanded] = useState(true);
  const hasChildren = item.children && item.children.length > 0;
  const isActive = item.href
    ? pathname === item.href || pathname.startsWith(item.href + '/')
    : false;

  const handleClick = useCallback(() => {
    if (hasChildren) {
      setIsExpanded((prev) => !prev);
    } else if (item.onClick) {
      item.onClick();
    }
  }, [hasChildren, item]);

  const content = (
    <>
      {item.icon && <span className={styles.itemIcon}>{item.icon}</span>}
      {!collapsed && (
        <>
          <span className={styles.itemLabel}>{item.label}</span>
          {item.badge && <span className={styles.itemBadge}>{item.badge}</span>}
          {hasChildren && (
            <ChevronDownIcon
              className={`${styles.expandIcon} ${isExpanded ? styles.expanded : ''}`}
            />
          )}
        </>
      )}
    </>
  );

  const itemClasses = [
    styles.navItem,
    isActive && styles.active,
    item.disabled && styles.disabled,
    collapsed && styles.collapsed,
  ]
    .filter(Boolean)
    .join(' ');

  const itemStyle = {
    paddingLeft: collapsed ? undefined : `${16 + depth * 12}px`,
  };

  const renderItem = () => {
    if (item.href && !hasChildren) {
      return (
        <Link href={item.href} className={itemClasses} style={itemStyle}>
          {content}
        </Link>
      );
    }

    return (
      <button
        type="button"
        className={itemClasses}
        style={itemStyle}
        onClick={handleClick}
        disabled={item.disabled}
      >
        {content}
      </button>
    );
  };

  return (
    <div className={styles.navItemWrapper}>
      {collapsed && item.icon ? (
        <Tooltip content={item.label} side="right">
          {renderItem()}
        </Tooltip>
      ) : (
        renderItem()
      )}
      {hasChildren && isExpanded && !collapsed && (
        <div className={styles.childrenContainer}>
          {item.children!.map((child) => (
            <NavItemComponent
              key={child.id}
              item={child}
              collapsed={collapsed}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export const SideNav = ({
  items,
  header,
  footer,
  footerItems,
  collapsed: controlledCollapsed,
  onCollapsedChange,
  width = 260,
  collapsedWidth = 68,
  className,
  variant = 'default',
}: SideNavProps) => {
  const [internalCollapsed, setInternalCollapsed] = useState(false);
  const collapsed = controlledCollapsed ?? internalCollapsed;

  const handleToggleCollapse = useCallback(() => {
    const newValue = !collapsed;
    if (onCollapsedChange) {
      onCollapsedChange(newValue);
    } else {
      setInternalCollapsed(newValue);
    }
  }, [collapsed, onCollapsedChange]);

  const currentWidth = collapsed ? collapsedWidth : width;

  const sideNavClasses = [
    styles.sideNav,
    styles[variant],
    collapsed && styles.collapsed,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  const renderItems = (itemsToRender: NavItem[]) => {
    return itemsToRender.map((item) => (
      <NavItemComponent key={item.id} item={item} collapsed={collapsed} />
    ));
  };

  const renderSections = (sections: NavSection[]) => {
    return sections.map((section, index) => (
      <div key={section.title || index} className={styles.section}>
        {section.title && !collapsed && (
          <Text size="1" weight="medium" className={styles.sectionTitle}>
            {section.title}
          </Text>
        )}
        <div className={styles.sectionItems}>{renderItems(section.items)}</div>
      </div>
    ));
  };

  return (
    <Box
      className={sideNavClasses}
      style={{ width: currentWidth, minWidth: currentWidth }}
    >
      <div className={styles.header}>
        <div className={styles.headerContent}>{header}</div>
        <button
          type="button"
          className={styles.collapseButton}
          onClick={handleToggleCollapse}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRightIcon /> : <ChevronLeftIcon />}
        </button>
      </div>

      <div className={styles.body}>
        <nav className={styles.nav}>
          {isSectionArray(items) ? renderSections(items) : renderItems(items)}
        </nav>

        {(footer || footerItems) && (
          <div className={styles.footer}>
            {footerItems && (
              <div className={styles.footerItems}>
                {renderItems(footerItems)}
              </div>
            )}
            {footer}
          </div>
        )}
      </div>
    </Box>
  );
};
