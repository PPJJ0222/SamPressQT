<script setup lang="ts">
import { MetricCard, Card } from '@/components/ui'
import { DeviceCard } from '@/components/business'
</script>

<template>
  <div class="p-6 space-y-6">
    <!-- 指标卡片 -->
    <div class="grid grid-cols-3 gap-4">
      <MetricCard
        label="运行设备"
        value="12"
        unit="台"
        icon="device"
        trend="up"
        change="+2"
      />
      <MetricCard
        label="今日产量"
        value="1,234"
        unit="件"
        icon="output"
        trend="up"
        change="+15%"
      />
      <MetricCard
        label="设备效率"
        value="92.5"
        unit="%"
        icon="percent"
        trend="down"
        change="-1.2%"
      />
    </div>

    <!-- 设备状态 -->
    <Card title="设备状态">
      <div class="grid grid-cols-2 gap-4">
        <DeviceCard
          name="压机 #1"
          model="YJ-500"
          status="running"
          :params="[
            { label: '压力', value: 450, unit: 'MPa' },
            { label: '温度', value: 85, unit: '℃' }
          ]"
        />
        <DeviceCard
          name="压机 #2"
          model="YJ-500"
          status="stopped"
          :params="[
            { label: '压力', value: 0, unit: 'MPa' },
            { label: '温度', value: 25, unit: '℃' }
          ]"
        />
      </div>
    </Card>
  </div>
</template>
