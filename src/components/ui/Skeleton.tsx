'use client'

import React from 'react'

interface SkeletonProps {
  className?: string
}

export function Skeleton({ className = '' }: SkeletonProps) {
  return (
    <div className={`animate-pulse bg-gray-200 rounded ${className}`} />
  )
}

/** Skeleton for a stat card */
export function StatCardSkeleton() {
  return (
    <div className="card-soft rounded-2xl p-4 sm:p-6">
      <div className="flex items-center justify-between mb-3 sm:mb-4">
        <Skeleton className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl" />
        <Skeleton className="w-16 h-5 rounded-full" />
      </div>
      <Skeleton className="w-20 h-7 mb-2" />
      <Skeleton className="w-28 h-4 mb-3" />
      <Skeleton className="w-36 h-3" />
    </div>
  )
}

/** Skeleton for a news card */
export function NewsCardSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center space-x-3">
          <Skeleton className="w-10 h-10 rounded-full" />
          <div className="flex-1">
            <Skeleton className="w-24 h-4 mb-2" />
            <Skeleton className="w-32 h-3" />
          </div>
          <Skeleton className="w-16 h-5 rounded-full" />
        </div>
      </div>
      <div className="p-4">
        <Skeleton className="w-3/4 h-5 mb-3" />
        <Skeleton className="w-full h-3 mb-2" />
        <Skeleton className="w-full h-3 mb-2" />
        <Skeleton className="w-2/3 h-3" />
      </div>
    </div>
  )
}

/** Skeleton for a complaint row */
export function ComplaintCardSkeleton() {
  return (
    <div className="bg-gray-50 rounded-2xl p-4">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-3">
          <Skeleton className="w-20 h-6 rounded-full" />
          <Skeleton className="w-16 h-5 rounded-full" />
        </div>
        <Skeleton className="w-24 h-3" />
      </div>
      <Skeleton className="w-full h-4 mb-2" />
      <div className="flex items-center space-x-4 mt-2">
        <Skeleton className="w-20 h-3" />
        <Skeleton className="w-24 h-3" />
      </div>
    </div>
  )
}

/** Skeleton for hero stats boxes */
export function HeroStatsSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-2">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="bg-white/10 backdrop-blur rounded-lg p-3 border border-white/20">
          <div className="text-center">
            <div className="animate-pulse bg-white/20 rounded w-12 h-6 mx-auto mb-1" />
            <div className="animate-pulse bg-white/10 rounded w-16 h-3 mx-auto" />
          </div>
        </div>
      ))}
    </div>
  )
}

export default Skeleton
