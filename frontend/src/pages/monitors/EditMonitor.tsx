import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Box, Flex, Heading, Text, Button, Card, TextField, Select, Table, IconButton, TextArea } from '@radix-ui/themes';
import { ArrowLeftIcon, UpdateIcon, PlusIcon, TrashIcon } from '@radix-ui/react-icons';
import { getMonitor, updateMonitor } from '../../api/monitors';
import StatusCodeSelect from '../../components/StatusCodeSelect';

const EditMonitor = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    url: '',
    method: 'GET',
    interval: 60,
    timeout: 30,
    expectedStatus: 200,
    body: ''
  });
  
  // 请求头部分使用键值对数组
  const [headers, setHeaders] = useState<{ key: string; value: string }[]>([
    { key: '', value: '' }
  ]);

  useEffect(() => {
    // 实际 API 调用获取监控数据
    const fetchMonitor = async () => {
      if (!id) return;
      
      try {
        setLoadingData(true);
        const response = await getMonitor(parseInt(id));
        
        if (response.success && response.monitor) {
          // 设置表单数据
          const monitor = response.monitor;
          setFormData({
            name: monitor.name,
            url: monitor.url,
            method: monitor.method,
            interval: Math.floor(monitor.interval / 60), // 从秒转换为分钟
            timeout: monitor.timeout,
            expectedStatus: monitor.expected_status,
            body: monitor.body || ''
          });
          
          // 处理请求头
          if (monitor.headers) {
            try {
              // 确保 headers 是对象
              const headersObj = typeof monitor.headers === 'string' 
                ? JSON.parse(monitor.headers) 
                : monitor.headers;
              
              const headerPairs = Object.entries(headersObj).map(([key, value]) => ({
                key,
                value: value as string
              }));
              
              // 如果没有请求头，添加一个空行
              if (headerPairs.length === 0) {
                headerPairs.push({ key: '', value: '' });
              } else {
                // 添加一个空行用于添加新的请求头
                headerPairs.push({ key: '', value: '' });
              }
              
              setHeaders(headerPairs);
            } catch (error) {
              console.error('解析请求头出错:', error);
              setHeaders([{ key: '', value: '' }]);
            }
          }
        } else {
          setError(response.message || '获取监控详情失败');
        }
      } catch (err) {
        console.error('获取监控详情错误:', err);
        setError('获取监控详情失败');
      } finally {
        setLoadingData(false);
      }
    };

    fetchMonitor();
  }, [id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'interval' || name === 'timeout' || name === 'expectedStatus' 
        ? parseInt(value) || 0 
        : value
    }));
  };
  
  // 处理状态码变更
  const handleStatusCodeChange = (value: number) => {
    setFormData(prev => ({ ...prev, expectedStatus: value }));
  };
  
  // 处理请求头键值对更改
  const handleHeaderChange = (index: number, field: 'key' | 'value', value: string) => {
    const newHeaders = [...headers];
    newHeaders[index][field] = value;
    
    // 如果最后一行有输入内容，添加新的空行
    if (index === headers.length - 1 && (newHeaders[index].key || newHeaders[index].value)) {
      newHeaders.push({ key: '', value: '' });
    }
    
    setHeaders(newHeaders);
  };
  
  // a删除请求头行
  const removeHeader = (index: number) => {
    if (headers.length > 1) {
      const newHeaders = [...headers];
      newHeaders.splice(index, 1);
      setHeaders(newHeaders);
    }
  };
  
  // 将键值对转换为JSON对象
  const headersToJson = () => {
    const result: Record<string, string> = {};
    
    headers.forEach(({ key, value }) => {
      if (key.trim()) {
        result[key.trim()] = value;
      }
    });
    
    return result;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    
    setLoading(true);

    try {
      // 调用实际 API
      const response = await updateMonitor(parseInt(id), {
        name: formData.name,
        url: formData.url,
        method: formData.method,
        interval: formData.interval * 60, // 转换为秒
        timeout: formData.timeout,
        expectedStatus: formData.expectedStatus,
        headers: headersToJson(),
        body: formData.body
      });
      
      if (response.success) {
        navigate(`/monitors/${id}`);
      } else {
        alert(`更新失败: ${response.message || '未知错误'}`);
      }
    } catch (error) {
      console.error('更新监控错误:', error);
      alert('更新监控失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };
  
  // 判断是否需要显示请求体输入框
  const showBodyField = ['POST', 'PUT', 'PATCH'].includes(formData.method);

  if (loadingData) {
    return (
      <Box>
        <Flex justify="center" align="center" style={{ minHeight: '60vh' }}>
          <Text>加载中...</Text>
        </Flex>
      </Box>
    );
  }

  if (error) {
    return (
      <Box>
        <Flex justify="center" align="center" style={{ minHeight: '60vh' }}>
          <Card>
            <Flex direction="column" align="center" gap="4" p="4">
              <Heading size="6">监控未找到</Heading>
              <Text>{error}</Text>
              <Button onClick={() => navigate('/monitors')}>返回监控列表</Button>
            </Flex>
          </Card>
        </Flex>
      </Box>
    );
  }

  return (
    <Box>
      <div className="page-container detail-page">
        <Flex justify="between" align="center" className="detail-header">
          <Flex align="center" gap="2">
            <Button variant="soft" size="1" onClick={() => navigate(`/monitors/${id}`)}>
              <ArrowLeftIcon />
            </Button>
            <Heading size="6">编辑监控: {formData.name}</Heading>
          </Flex>
        </Flex>

        <div className="detail-content">
          <Card>
            <form onSubmit={handleSubmit}>
              <Box pt="2">
                <Flex direction="column" gap="4">
                  <Box>
                    <Text as="label" size="2" style={{ marginBottom: '4px', display: 'block' }}>
                      监控名称 *
                    </Text>
                    <TextField.Input
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="输入监控名称"
                      required
                    />
                  </Box>

                  <Box>
                    <Text as="label" size="2" style={{ marginBottom: '4px', display: 'block' }}>
                      URL *
                    </Text>
                    <TextField.Input
                      name="url"
                      value={formData.url}
                      onChange={handleChange}
                      placeholder="输入要监控的URL"
                      required
                    />
                  </Box>

                  <Box>
                    <Text as="label" size="2" style={{ marginBottom: '4px', display: 'block' }}>
                      请求方法 *
                    </Text>
                    <Select.Root 
                      name="method" 
                      value={formData.method} 
                      onValueChange={(value) => setFormData(prev => ({ ...prev, method: value }))}
                    >
                      <Select.Trigger />
                      <Select.Content>
                        <Select.Item value="GET">GET</Select.Item>
                        <Select.Item value="POST">POST</Select.Item>
                        <Select.Item value="PUT">PUT</Select.Item>
                        <Select.Item value="DELETE">DELETE</Select.Item>
                        <Select.Item value="HEAD">HEAD</Select.Item>
                      </Select.Content>
                    </Select.Root>
                  </Box>

                  <Flex gap="4">
                    <Box style={{ flex: 1 }}>
                      <Text as="label" size="2" style={{ marginBottom: '4px', display: 'block' }}>
                        检查间隔（分钟）*
                      </Text>
                      <TextField.Input
                        name="interval"
                        type="number"
                        value={formData.interval.toString()}
                        onChange={handleChange}
                        min="1"
                        required
                      />
                      <Text size="1" color="gray">
                        最小间隔 1 分钟
                      </Text>
                    </Box>

                    <Box style={{ flex: 1 }}>
                      <Text as="label" size="2" style={{ marginBottom: '4px', display: 'block' }}>
                        超时时间（秒）*
                      </Text>
                      <TextField.Input
                        name="timeout"
                        type="number"
                        value={formData.timeout.toString()}
                        onChange={handleChange}
                        min="1"
                        required
                      />
                    </Box>
                  </Flex>

                  <Box>
                    <Text as="label" size="2" style={{ marginBottom: '4px', display: 'block' }}>
                      预期状态码 *
                    </Text>
                    <StatusCodeSelect 
                      value={formData.expectedStatus}
                      onChange={handleStatusCodeChange}
                      required
                    />
                  </Box>

                  <Box>
                    <Text as="label" size="2" style={{ marginBottom: '4px', display: 'block' }}>
                      请求头
                    </Text>
                    <Box style={{ border: '1px solid var(--gray-6)', borderRadius: '6px', padding: '8px', marginBottom: '8px' }}>
                      <Table.Root>
                        <Table.Header>
                          <Table.Row>
                            <Table.ColumnHeaderCell>名称</Table.ColumnHeaderCell>
                            <Table.ColumnHeaderCell>值</Table.ColumnHeaderCell>
                            <Table.ColumnHeaderCell style={{ width: '40px' }}></Table.ColumnHeaderCell>
                          </Table.Row>
                        </Table.Header>
                        <Table.Body>
                          {headers.map((header, index) => (
                            <Table.Row key={index}>
                              <Table.Cell>
                                <TextField.Input
                                  placeholder="Header Name"
                                  value={header.key}
                                  onChange={(e) => handleHeaderChange(index, 'key', e.target.value)}
                                />
                              </Table.Cell>
                              <Table.Cell>
                                <TextField.Input
                                  placeholder="Header Value"
                                  value={header.value}
                                  onChange={(e) => handleHeaderChange(index, 'value', e.target.value)}
                                />
                              </Table.Cell>
                              <Table.Cell>
                                <IconButton 
                                  variant="soft" 
                                  color="red" 
                                  size="1"
                                  onClick={() => removeHeader(index)}
                                >
                                  <TrashIcon />
                                </IconButton>
                              </Table.Cell>
                            </Table.Row>
                          ))}
                        </Table.Body>
                      </Table.Root>
                      <Flex justify="end" mt="2">
                        <Button 
                          size="1" 
                          variant="soft"
                          onClick={() => setHeaders([...headers, { key: '', value: '' }])}
                        >
                          <PlusIcon />
                          添加请求头
                        </Button>
                      </Flex>
                    </Box>
                    <Text size="1" color="gray">
                      添加请求头，例如：Content-Type: application/json
                    </Text>
                  </Box>

                  {showBodyField && (
                    <Box>
                      <Text as="label" size="2" style={{ marginBottom: '4px', display: 'block' }}>
                        请求体
                      </Text>
                      <TextArea
                        name="body"
                        value={formData.body}
                        onChange={handleChange}
                        placeholder="请求体内容"
                        style={{ minHeight: '100px' }}
                      />
                    </Box>
                  )}
                </Flex>
              </Box>

              <Flex justify="end" mt="4" gap="2">
                <Button variant="soft" onClick={() => navigate(`/monitors/${id}`)}>
                  取消
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? '保存中...' : '保存更改'}
                  {!loading && <UpdateIcon />}
                </Button>
              </Flex>
            </form>
          </Card>
        </div>
      </div>
    </Box>
  );
};

export default EditMonitor; 