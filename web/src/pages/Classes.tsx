import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { supabase } from '@/lib/supabase';
import { ClassFormDialog } from '@/components/classes/ClassFormDialog';
import { DeleteClassDialog } from '@/components/classes/DeleteClassDialog';
import {
  Dumbbell,
  Search,
  Users,
  Clock,
  MapPin,
  Calendar,
  Plus,
  MoreVertical,
  Pencil,
  Trash2,
} from 'lucide-react';
import dayjs from 'dayjs';

interface ClassWithDetails {
  id: string;
  name: string;
  description: string | null;
  start_time: string;
  end_time: string;
  capacity: number;
  trainer_id: string | null;
  location_id: string | null;
  trainer?: { full_name: string; avatar_url: string | null };
  location?: { name: string };
  bookings: { count: number }[];
}

export default function Classes() {
  const [classes, setClasses] = useState<ClassWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Dialog states
  const [formOpen, setFormOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedClass, setSelectedClass] = useState<ClassWithDetails | null>(null);

  useEffect(() => {
    fetchClasses();
  }, []);

  async function fetchClasses() {
    setLoading(true);
    const { data, error } = await supabase
      .from('classes')
      .select(`
        *,
        trainer:trainer_id (full_name, avatar_url),
        location:location_id (name),
        bookings (count)
      `)
      .order('start_time', { ascending: true });

    if (!error && data) {
      setClasses(data as ClassWithDetails[]);
    }
    setLoading(false);
  }

  const filteredClasses = classes.filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const upcomingClasses = filteredClasses.filter(c => 
    dayjs(c.start_time).isAfter(dayjs())
  );

  const pastClasses = filteredClasses.filter(c => 
    dayjs(c.start_time).isBefore(dayjs())
  );

  const getBookingsCount = (cls: ClassWithDetails) => {
    return cls.bookings?.[0]?.count || 0;
  };

  function handleAdd() {
    setSelectedClass(null);
    setFormOpen(true);
  }

  function handleEdit(gymClass: ClassWithDetails) {
    setSelectedClass(gymClass);
    setFormOpen(true);
  }

  function handleDelete(gymClass: ClassWithDetails) {
    setSelectedClass(gymClass);
    setDeleteOpen(true);
  }

  function handleSuccess() {
    fetchClasses();
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              Quản lý Lớp học
            </h1>
            <p className="mt-1 text-muted-foreground">
              Thêm, sửa, xóa lớp học và chỉ định PT phụ trách
            </p>
          </div>
          <Button onClick={handleAdd}>
            <Plus className="mr-2 h-4 w-4" />
            Thêm lớp học
          </Button>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="border-border/50 bg-card/80">
            <CardContent className="flex items-center gap-4 p-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/20">
                <Dumbbell className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{classes.length}</p>
                <p className="text-sm text-muted-foreground">Tổng lớp học</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border/50 bg-card/80">
            <CardContent className="flex items-center gap-4 p-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-500/20">
                <Calendar className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{upcomingClasses.length}</p>
                <p className="text-sm text-muted-foreground">Sắp diễn ra</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border/50 bg-card/80">
            <CardContent className="flex items-center gap-4 p-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-orange-500/20">
                <Users className="h-6 w-6 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">
                  {classes.reduce((acc, c) => acc + getBookingsCount(c), 0)}
                </p>
                <p className="text-sm text-muted-foreground">Tổng đăng ký</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <Card className="border-border/50 bg-card/80">
          <CardContent className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Tìm kiếm lớp học..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        ) : (
          <>
            {/* Upcoming Classes */}
            {upcomingClasses.length > 0 && (
              <div className="space-y-4">
                <h2 className="text-xl font-semibold text-foreground">Lớp sắp diễn ra</h2>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {upcomingClasses.map((gymClass) => (
                    <ClassCard 
                      key={gymClass.id} 
                      gymClass={gymClass} 
                      getBookingsCount={getBookingsCount}
                      onEdit={() => handleEdit(gymClass)}
                      onDelete={() => handleDelete(gymClass)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Past Classes */}
            {pastClasses.length > 0 && (
              <div className="space-y-4">
                <h2 className="text-xl font-semibold text-muted-foreground">Lớp đã kết thúc</h2>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {pastClasses.slice(0, 6).map((gymClass) => (
                    <ClassCard 
                      key={gymClass.id} 
                      gymClass={gymClass} 
                      getBookingsCount={getBookingsCount} 
                      isPast
                      onEdit={() => handleEdit(gymClass)}
                      onDelete={() => handleDelete(gymClass)}
                    />
                  ))}
                </div>
              </div>
            )}

            {filteredClasses.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12">
                <Dumbbell className="h-16 w-16 text-muted-foreground" />
                <p className="mt-4 text-muted-foreground">Chưa có lớp học nào</p>
                <Button className="mt-4" onClick={handleAdd}>
                  <Plus className="mr-2 h-4 w-4" />
                  Thêm lớp học đầu tiên
                </Button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Dialogs */}
      <ClassFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        classData={selectedClass}
        onSuccess={handleSuccess}
      />
      <DeleteClassDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        classData={selectedClass}
        onSuccess={handleSuccess}
      />
    </DashboardLayout>
  );
}

function ClassCard({ 
  gymClass, 
  getBookingsCount,
  isPast = false,
  onEdit,
  onDelete,
}: { 
  gymClass: ClassWithDetails; 
  getBookingsCount: (c: ClassWithDetails) => number;
  isPast?: boolean;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const bookings = getBookingsCount(gymClass);
  const isFull = bookings >= gymClass.capacity;

  return (
    <Card className={`border-border/50 bg-card/80 overflow-hidden ${isPast ? 'opacity-60' : ''}`}>
      <div className="aspect-video bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center relative">
        <Dumbbell className="h-16 w-16 text-primary/50" />
        
        {/* Actions Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="ghost" 
              size="icon" 
              className="absolute top-2 right-2 h-8 w-8 bg-background/80 hover:bg-background"
            >
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onEdit}>
              <Pencil className="mr-2 h-4 w-4" />
              Chỉnh sửa
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={onDelete}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Xóa
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="font-semibold text-foreground">
              {gymClass.name}
            </h3>
            <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
              {gymClass.description || 'Không có mô tả'}
            </p>
          </div>
        </div>

        <div className="mt-4 space-y-2">
          {/* Time */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>
              {dayjs(gymClass.start_time).format('HH:mm')} - {dayjs(gymClass.end_time).format('HH:mm')}
            </span>
            <span className="text-xs">
              ({dayjs(gymClass.start_time).format('DD/MM/YYYY')})
            </span>
          </div>

          {/* Location */}
          {gymClass.location && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4" />
              <span>{gymClass.location.name}</span>
            </div>
          )}

          {/* Trainer */}
          {gymClass.trainer && (
            <div className="flex items-center gap-2">
              <Avatar className="h-6 w-6">
                <AvatarImage src={gymClass.trainer.avatar_url || undefined} />
                <AvatarFallback className="bg-primary/20 text-primary text-xs">
                  {gymClass.trainer.full_name?.charAt(0) || 'P'}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm text-muted-foreground">
                {gymClass.trainer.full_name}
              </span>
            </div>
          )}
        </div>

        <div className="mt-4 flex items-center justify-between">
          <Badge 
            variant={isFull ? 'destructive' : 'secondary'} 
            className={isFull ? '' : 'bg-primary/10 text-primary'}
          >
            <Users className="mr-1 h-3 w-3" />
            {bookings}/{gymClass.capacity} người
          </Badge>
          {isFull && (
            <Badge variant="outline" className="text-destructive border-destructive">
              Đã đầy
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
