import { Footer } from "@/components/footer";
import { Navbar } from "@/components/navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Heading } from "@/components/ui/heading";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  Loader2, 
  Clock, 
  CheckCircle, 
  Wrench, 
  AlertCircle,
  Eye,
  ClipboardList,
  TrendingUp
} from "lucide-react";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { fetchWorkOrders, getStatusInfo, getPriorityInfo } from "@/services/work-order-service";
import type { WorkOrder, WorkOrderStatus } from "@/types/supabase-custom";

const MaintenanceDashboard = () => {
  const navigate = useNavigate();
  const { role } = useAuth();
  
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("pending");

  useEffect(() => {
    loadWorkOrders();
  }, []);

  const loadWorkOrders = async () => {
    setIsLoading(true);
    try {
      const orders = await fetchWorkOrders();
      setWorkOrders(orders);
    } catch (error) {
      console.error("Error loading work orders:", error);
      toast.error("Failed to load work orders");
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getFilteredOrders = (status: string) => {
    if (status === 'all') return workOrders;
    if (status === 'active') {
      return workOrders.filter(o => 
        ['pending', 'approved', 'in_progress', 'completed'].includes(o.status)
      );
    }
    return workOrders.filter(o => o.status === status);
  };

  // Stats
  const stats = {
    pending: workOrders.filter(o => o.status === 'pending').length,
    inProgress: workOrders.filter(o => o.status === 'in_progress').length,
    completed: workOrders.filter(o => o.status === 'completed').length,
    signedOff: workOrders.filter(o => o.status === 'signed_off').length,
    total: workOrders.length,
  };

  const renderWorkOrderRow = (order: WorkOrder) => {
    const statusInfo = getStatusInfo(order.status);
    const priorityInfo = getPriorityInfo(order.priority);

    return (
      <TableRow 
        key={order.id} 
        className="cursor-pointer hover:bg-gray-50"
        onClick={() => navigate(`/work-orders/${order.id}`)}
      >
        <TableCell>
          <div>
            <p className="font-medium">{order.title}</p>
            <p className="text-sm text-gray-500 truncate max-w-xs">{order.description}</p>
          </div>
        </TableCell>
        <TableCell>{order.location}</TableCell>
        <TableCell>
          <Badge className={`${priorityInfo.bgColor} ${priorityInfo.color}`}>
            {priorityInfo.label}
          </Badge>
        </TableCell>
        <TableCell>
          <Badge variant="outline" className={`${statusInfo.bgColor} ${statusInfo.color}`}>
            {statusInfo.label}
          </Badge>
        </TableCell>
        <TableCell>{formatDate(order.created_at)}</TableCell>
        <TableCell>
          <Button variant="ghost" size="sm">
            <Eye className="h-4 w-4" />
          </Button>
        </TableCell>
      </TableRow>
    );
  };

  if (role !== 'admin' && role !== 'maintenance') {
    return (
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <div className="flex-grow flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
            <p className="text-gray-500 mb-4">You don't have permission to access this page.</p>
            <Button onClick={() => navigate('/work-orders')}>Go to Work Orders</Button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      
      <div className="bg-navy-800 py-8">
        <div className="container mx-auto px-4">
          <Heading className="text-white text-center">Maintenance Dashboard</Heading>
          <p className="text-center text-gray-300 mt-2">Manage all work orders</p>
        </div>
      </div>
      
      <main className="container mx-auto px-4 py-8 flex-grow">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Pending</p>
                  <p className="text-2xl font-bold">{stats.pending}</p>
                </div>
                <Clock className="h-8 w-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">In Progress</p>
                  <p className="text-2xl font-bold">{stats.inProgress}</p>
                </div>
                <Wrench className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Awaiting Sign-off</p>
                  <p className="text-2xl font-bold">{stats.completed}</p>
                </div>
                <AlertCircle className="h-8 w-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Completed</p>
                  <p className="text-2xl font-bold">{stats.signedOff}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Total</p>
                  <p className="text-2xl font-bold">{stats.total}</p>
                </div>
                <ClipboardList className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Work Orders Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ClipboardList className="h-5 w-5" />
              Work Orders
            </CardTitle>
            <CardDescription>
              Click on any row to view details and take action
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="mb-4">
                <TabsTrigger value="pending" className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  Pending ({stats.pending})
                </TabsTrigger>
                <TabsTrigger value="in_progress" className="flex items-center gap-1">
                  <Wrench className="h-4 w-4" />
                  In Progress ({stats.inProgress})
                </TabsTrigger>
                <TabsTrigger value="completed" className="flex items-center gap-1">
                  <AlertCircle className="h-4 w-4" />
                  Awaiting Sign-off ({stats.completed})
                </TabsTrigger>
                <TabsTrigger value="all">All</TabsTrigger>
              </TabsList>

              {isLoading ? (
                <div className="flex justify-center items-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : (
                <>
                  <TabsContent value="pending">
                    {getFilteredOrders('pending').length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        No pending work orders
                      </div>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Issue</TableHead>
                            <TableHead>Location</TableHead>
                            <TableHead>Priority</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Created</TableHead>
                            <TableHead></TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {getFilteredOrders('pending').map(renderWorkOrderRow)}
                        </TableBody>
                      </Table>
                    )}
                  </TabsContent>

                  <TabsContent value="in_progress">
                    {getFilteredOrders('in_progress').length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        No work orders in progress
                      </div>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Issue</TableHead>
                            <TableHead>Location</TableHead>
                            <TableHead>Priority</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Created</TableHead>
                            <TableHead></TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {getFilteredOrders('in_progress').map(renderWorkOrderRow)}
                        </TableBody>
                      </Table>
                    )}
                  </TabsContent>

                  <TabsContent value="completed">
                    {getFilteredOrders('completed').length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        No work orders awaiting sign-off
                      </div>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Issue</TableHead>
                            <TableHead>Location</TableHead>
                            <TableHead>Priority</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Created</TableHead>
                            <TableHead></TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {getFilteredOrders('completed').map(renderWorkOrderRow)}
                        </TableBody>
                      </Table>
                    )}
                  </TabsContent>

                  <TabsContent value="all">
                    {workOrders.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        No work orders found
                      </div>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Issue</TableHead>
                            <TableHead>Location</TableHead>
                            <TableHead>Priority</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Created</TableHead>
                            <TableHead></TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {workOrders.map(renderWorkOrderRow)}
                        </TableBody>
                      </Table>
                    )}
                  </TabsContent>
                </>
              )}
            </Tabs>
          </CardContent>
        </Card>
      </main>
      
      <Footer />
    </div>
  );
};

export default MaintenanceDashboard;
