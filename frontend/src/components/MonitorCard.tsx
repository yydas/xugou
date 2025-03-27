import { Box, Card, Flex, Text, Badge } from '@radix-ui/themes';
import { CheckCircledIcon, CrossCircledIcon, QuestionMarkCircledIcon } from '@radix-ui/react-icons';
import { Monitor } from '../api/monitors';
import HeartbeatGrid from './HeartbeatGrid';
import '../styles/components.css';
import { useTranslation } from 'react-i18next';

interface MonitorCardProps {
  monitor: Monitor;
}

/**
 * API监控卡片组件
 * 用于显示单个API监控服务的状态信息
 */
const MonitorCard = ({ monitor }: MonitorCardProps) => {
  const { t } = useTranslation();
  
  // 状态图标组件
  const StatusIcon = ({ status }: { status: string }) => {
    switch (status) {
      case 'up':
        return <CheckCircledIcon width="16" height="16" color="var(--green-9)" />;
      case 'pending':
        return <QuestionMarkCircledIcon width="16" height="16" color="var(--amber-9)" />;
      case 'down':
      default:
        return <CrossCircledIcon width="16" height="16" color="var(--red-9)" />;
    }
  };

  // 状态颜色映射
  const statusColors: { [key: string]: string } = {
    'up': 'green',
    'down': 'red',
    'pending': 'amber'
  };

  // 状态文本映射
  const statusText: { [key: string]: string } = {
    'up': t('monitorCard.status.up'),
    'down': t('monitorCard.status.down'),
    'pending': t('monitorCard.status.pending')
  };

  // 获取当前监控的状态
  const currentStatus = monitor.status || 'pending';

  // 处理卡片点击
  const handleCardClick = () => {
    if (monitor.url) {
      window.open(monitor.url, '_blank');
    }
  };

  return (
    <Card 
      className="monitor-card clickable" 
      onClick={handleCardClick}
      style={{ 
        cursor: monitor.url ? 'pointer' : 'default',
        transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out'
      }}
    >
      <Flex justify="between" align="start" p="4" gap="2" direction="column">
        <Flex justify="between" align="center" style={{ width: '100%' }}>
          <Flex align="center" gap="2">
            <StatusIcon status={currentStatus} />
            <Text weight="medium">{monitor.name}</Text>
          </Flex>
          <Badge color={statusColors[currentStatus] as any}>
            {statusText[currentStatus]}
          </Badge>
        </Flex>
        
        <Flex align="center" gap="2" style={{ width: '100%', minHeight: '8px' }}>
          <Text size="1" color="gray">
            {t('monitorCard.responseTime')}: {monitor.response_time || t('monitorCard.unknown')}ms
          </Text>
        </Flex>
          
        <Box pt="2" style={{ width: '100%' }}>
          <HeartbeatGrid 
            uptime={monitor.uptime} 
            history={monitor.history} 
          />
        </Box>
      </Flex>
    </Card>
  );
};

export default MonitorCard;
