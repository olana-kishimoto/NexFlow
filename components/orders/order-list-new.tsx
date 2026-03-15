'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card } from '@/components/ui/card';
import { MoveHorizontal as MoreHorizontal, CreditCard as Edit2, FileText, Send, Trash2, Eye } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Order {
  id: string;
  customer_id: string;
  service_description: string;
  start_date: string;
  end_date: string;
  amount: number;
  tax_rate: number;
  commission_rate: number;
  status: 'draft' | 'active' | 'void' | 'cancelled';
  created_at: string;
  customers?: {
    customer_name: string;
  };
}

const statusColors: Record<string, { bg: string; text: string; label: string }> = {
  draft: { bg: 'bg-[#2A2A2A]', text: 'text-[#888888]', label: '下書き' },
  active: { bg: 'bg-[#064E3B]', text: 'text-[#10B981]', label: '契約中' },
  void: { bg: 'bg-[#450A0A]', text: 'text-[#EF4444]', label: '無効' },
  cancelled: { bg: 'bg-[#2A2A2A]', text: 'text-[#555555]', label: '解約済' },
};

export function OrderListNew() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [highlightedOrderId, setHighlightedOrderId] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    fetchOrders();
    const highlightId = sessionStorage.getItem('highlightOrderId');
    if (highlightId) {
      setHighlightedOrderId(highlightId);
      sessionStorage.removeItem('highlightOrderId');
      setTimeout(() => setHighlightedOrderId(null), 3000);
    }
  }, []);

  async function fetchOrders() {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*, customers(customer_name)')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  }

  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      !searchText ||
      order.customers?.customer_name?.toLowerCase().includes(searchText.toLowerCase()) ||
      order.service_description?.toLowerCase().includes(searchText.toLowerCase());

    const matchesStatus = statusFilter.length === 0 || statusFilter.includes(order.status);

    return matchesSearch && matchesStatus;
  });

  const draftCount = orders.filter((o) => o.status === 'draft').length;
  const activeCount = orders.filter((o) => o.status === 'active').length;
  const totalAmount = orders
    .filter((o) => o.status === 'active')
    .reduce((sum, o) => sum + o.amount, 0);

  const formatCurrency = (amount: number) => {
    return `¥${amount.toLocaleString('ja-JP')}`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ja-JP', { month: '2-digit', day: '2-digit' });
  };

  const formatDateRange = (start: string, end: string) => {
    return `${formatDate(start)} 〜 ${formatDate(end)}`;
  };

  const calculateGrossProfit = (amount: number, commissionRate: number) => {
    const commission = amount * (commissionRate / 100);
    return amount - commission;
  };

  const handleVoid = (orderId: string) => {
    router.push(`/orders-manage/${orderId}/void`);
  };

  if (loading) {
    return <div className="text-center py-8">読み込み中...</div>;
  }

  return (
    <div className="space-y-6">
      {/* KPI Summary */}
      <div className="grid grid-cols-4 gap-4">
        <Card className="p-4 bg-[#1A1A1A] border border-[#2A2A2A]">
          <p className="text-11px font-medium text-[#888888] uppercase tracking-wide">全件数</p>
          <p className="text-20px font-semibold text-[#EDEDED] mt-1 font-mono">{orders.length}</p>
        </Card>
        <Card className="p-4 bg-[#1A1A1A] border border-[#2A2A2A]">
          <p className="text-11px font-medium text-[#888888] uppercase tracking-wide">下書き</p>
          <p className="text-20px font-semibold text-[#EDEDED] mt-1 font-mono">{draftCount}</p>
        </Card>
        <Card className="p-4 bg-[#1A1A1A] border border-[#2A2A2A]">
          <p className="text-11px font-medium text-[#888888] uppercase tracking-wide">契約中</p>
          <p className="text-20px font-semibold text-[#EDEDED] mt-1 font-mono">{activeCount}</p>
        </Card>
        <Card className="p-4 bg-[#1A1A1A] border border-[#2A2A2A]">
          <p className="text-11px font-medium text-[#888888] uppercase tracking-wide">今月受注金額</p>
          <p className="text-20px font-semibold text-[#EDEDED] mt-1 font-mono">
            {formatCurrency(totalAmount)}
          </p>
        </Card>
      </div>

      {/* Filter Bar */}
      <Card className="p-4 bg-[#1A1A1A] border border-[#2A2A2A]">
        <div className="flex gap-4">
          <Input
            placeholder="得意先名・業務内容を検索..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            className="flex-1 bg-[#141414] border border-[#2A2A2A] text-[#EDEDED] placeholder-[#555555]"
          />
          <div className="flex gap-2">
            {['draft', 'active', 'void', 'cancelled'].map((status) => (
              <Button
                key={status}
                variant={statusFilter.includes(status) ? 'default' : 'outline'}
                size="sm"
                onClick={() =>
                  setStatusFilter((prev) =>
                    prev.includes(status) ? prev.filter((s) => s !== status) : [...prev, status]
                  )
                }
              >
                {statusColors[status as keyof typeof statusColors].label}
              </Button>
            ))}
          </div>
        </div>
      </Card>

      {/* Orders Table */}
      <Card className="bg-[#1A1A1A] border border-[#2A2A2A] overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-[#141414] border-b border-[#2A2A2A]">
              <TableHead className="text-11px font-medium text-[#888888] uppercase">得意先名</TableHead>
              <TableHead className="text-11px font-medium text-[#888888] uppercase">業務内容</TableHead>
              <TableHead className="text-11px font-medium text-[#888888] uppercase">契約期間</TableHead>
              <TableHead className="text-11px font-medium text-[#888888] uppercase text-right">受注金額</TableHead>
              <TableHead className="text-11px font-medium text-[#888888] uppercase text-right">粗利</TableHead>
              <TableHead className="text-11px font-medium text-[#888888] uppercase">ステータス</TableHead>
              <TableHead className="text-11px font-medium text-[#888888] uppercase">作成日</TableHead>
              <TableHead className="text-11px font-medium text-[#888888] uppercase text-center">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredOrders.map((order) => (
              <TableRow
                key={order.id}
                className={`h-11 border-b border-[#2A2A2A] hover:bg-[#1F1F1F] transition-colors ${
                  highlightedOrderId === order.id ? 'bg-[#064E3B]' : ''
                }`}
              >
                <TableCell className="text-13px text-[#EDEDED] font-medium pl-4">
                  {order.customers?.customer_name}
                </TableCell>
                <TableCell className="text-13px text-[#EDEDED] max-w-xs truncate">
                  {order.service_description}
                </TableCell>
                <TableCell className="text-13px text-[#EDEDED]">
                  {formatDateRange(order.start_date, order.end_date)}
                </TableCell>
                <TableCell className="text-13px font-mono text-[#EDEDED] text-right pr-4">
                  {formatCurrency(order.amount)}
                </TableCell>
                <TableCell className="text-13px font-mono text-[#EDEDED] text-right pr-4">
                  {formatCurrency(calculateGrossProfit(order.amount, order.commission_rate))}
                </TableCell>
                <TableCell>
                  <Badge
                    className={`${statusColors[order.status].bg} ${statusColors[order.status].text} border-0 text-10px`}
                  >
                    {statusColors[order.status].label}
                  </Badge>
                </TableCell>
                <TableCell className="text-13px text-[#EDEDED]">
                  {formatDate(order.created_at)}
                </TableCell>
                <TableCell className="text-center">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                        <MoreHorizontal className="w-3.5 h-3.5" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {order.status === 'draft' && (
                        <>
                          <DropdownMenuItem asChild>
                            <Link href={`/orders-manage/${order.id}/edit`}>
                              <Edit2 className="w-4 h-4 mr-2" />
                              編集
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link href={`/orders/${order.id}`}>
                              <FileText className="w-4 h-4 mr-2" />
                              PDF確認
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Send className="w-4 h-4 mr-2" />
                            クラウドサイン送信
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => handleVoid(order.id)}
                            className="text-red-600"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            無効にする
                          </DropdownMenuItem>
                        </>
                      )}
                      {order.status === 'active' && (
                        <>
                          <DropdownMenuItem asChild>
                            <Link href={`/orders/${order.id}`}>
                              <Eye className="w-4 h-4 mr-2" />
                              詳細表示
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link href={`/orders/${order.id}`}>
                              <FileText className="w-4 h-4 mr-2" />
                              PDF確認
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Send className="w-4 h-4 mr-2" />
                            マネーフォワード請求作成
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => handleVoid(order.id)}
                            className="text-red-600"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            無効にする
                          </DropdownMenuItem>
                        </>
                      )}
                      {(order.status === 'void' || order.status === 'cancelled') && (
                        <DropdownMenuItem asChild>
                          <Link href={`/orders/${order.id}`}>
                            <Eye className="w-4 h-4 mr-2" />
                            詳細表示
                          </Link>
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      {filteredOrders.length === 0 && (
        <div className="text-center py-12">
          <p className="text-[#888888] text-13px">受注がありません</p>
        </div>
      )}
    </div>
  );
}
