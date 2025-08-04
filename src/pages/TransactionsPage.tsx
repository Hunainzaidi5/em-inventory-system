import React, { useState, useEffect } from "react";
import { Search, Plus, Filter, Download, Eye, Pencil, Trash2, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { format } from "date-fns";

type TransactionType = 'issue' | 'return' | 'consume';
type ItemType = 'inventory' | 'tool' | 'ppe' | 'general' | 'faulty_return';

interface Transaction {
  id: string;
  transactionType: TransactionType;
  itemType: ItemType;
  itemName: string;
  quantity: number;
  issuedTo: string;
  department: string;
  referenceNumber: string;
  createdAt: string;
  status: 'completed' | 'pending' | 'overdue';
}

const TransactionsPage = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  // Mock data - Replace with API calls in a real application
  useEffect(() => {
    const fetchTransactions = () => {
      setTimeout(() => {
        const mockTransactions: Transaction[] = [
          {
            id: '1',
            transactionType: 'issue',
            itemType: 'inventory',
            itemName: 'Safety Helmet Yellow',
            quantity: 5,
            issuedTo: 'John Doe',
            department: 'Maintenance',
            referenceNumber: 'TRX-2023-001',
            createdAt: '2025-08-01T10:30:00Z',
            status: 'completed'
          },
          {
            id: '2',
            transactionType: 'return',
            itemType: 'tool',
            itemName: 'Power Drill',
            quantity: 2,
            issuedTo: 'Jane Smith',
            department: 'Engineering',
            referenceNumber: 'TRX-2023-002',
            createdAt: '2025-08-02T14:15:00Z',
            status: 'pending'
          },
          {
            id: '3',
            transactionType: 'consume',
            itemType: 'general',
            itemName: 'Safety Gloves',
            quantity: 10,
            issuedTo: 'Robert Johnson',
            department: 'Operations',
            referenceNumber: 'TRX-2023-003',
            createdAt: '2025-08-03T09:45:00Z',
            status: 'overdue'
          }
        ];
        
        setTransactions(mockTransactions);
        setIsLoading(false);
      }, 500);
    };

    fetchTransactions();
  }, []);

  const filteredTransactions = transactions.filter(tx => 
    tx.itemName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    tx.issuedTo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    tx.referenceNumber.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge variant="default">Completed</Badge>;
      case 'pending':
        return <Badge variant="outline">Pending</Badge>;
      case 'overdue':
        return <Badge variant="destructive">Overdue</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const getTypeBadge = (type: string) => {
    return <Badge variant="secondary" className="capitalize">{type}</Badge>;
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">Transactions</h1>
          <p className="text-sm text-muted-foreground">
            View and manage all inventory transactions
          </p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" /> New Transaction
        </Button>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search transactions..."
            className="pl-9"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Button variant="outline">
          <Filter className="mr-2 h-4 w-4" />
          Filters
        </Button>
        <Button variant="outline">
          <Download className="mr-2 h-4 w-4" />
          Export
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Reference #</TableHead>
              <TableHead>Item</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Quantity</TableHead>
              <TableHead>Issued To</TableHead>
              <TableHead>Department</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={9} className="h-24 text-center">
                  Loading transactions...
                </TableCell>
              </TableRow>
            ) : filteredTransactions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="h-24 text-center">
                  No transactions found.
                </TableCell>
              </TableRow>
            ) : (
              filteredTransactions.map((txn) => (
                <TableRow key={txn.id}>
                  <TableCell className="font-medium">{txn.referenceNumber}</TableCell>
                  <TableCell>{txn.itemName}</TableCell>
                  <TableCell>{getTypeBadge(txn.itemType)}</TableCell>
                  <TableCell>{txn.quantity}</TableCell>
                  <TableCell>{txn.issuedTo}</TableCell>
                  <TableCell>{txn.department}</TableCell>
                  <TableCell>{format(new Date(txn.createdAt), 'MMM dd, yyyy')}</TableCell>
                  <TableCell>{getStatusBadge(txn.status)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default TransactionsPage;