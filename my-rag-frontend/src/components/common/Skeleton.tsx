/**
 * 通用骨架屏组件
 */
import { motion } from 'framer-motion'

interface SkeletonProps {
  className?: string
  variant?: 'text' | 'circular' | 'rectangular'
  width?: string | number
  height?: string | number
}

export const Skeleton = ({ 
  className = '', 
  variant = 'text', 
  width, 
  height 
}: SkeletonProps) => {
  const baseStyle = "bg-gray-200 dark:bg-gray-700 rounded"
  
  const variantStyles = {
    text: "h-4 w-full",
    circular: "rounded-full",
    rectangular: "rounded-md"
  }

  const style = {
    width: width || (variant === 'circular' ? height : undefined),
    height,
  }

  return (
    <motion.div
      initial={{ opacity: 0.6 }}
      animate={{ opacity: [0.6, 0.8, 0.6] }}
      transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
      className={`${baseStyle} ${variantStyles[variant]} ${className}`}
      style={style}
    />
  )
}
