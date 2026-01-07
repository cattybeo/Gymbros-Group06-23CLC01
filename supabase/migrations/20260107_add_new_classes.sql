-- Migration: Rebuild Classes Catalog (16 Courses)
-- Generated on 2026-01-07
-- Objective: Truncate existing data and seed a unified Vietnamese catalog.

-- 1. Clear existing data (CAUTION: This will remove all existing classes and related bookings if not using ON DELETE CASCADE)
-- If foreign keys prevent truncate, we use DELETE. 
TRUNCATE public.classes RESTART IDENTITY CASCADE;

-- 2. Seed 16 Unified Classes
INSERT INTO public.classes (name, description, capacity, image_slug, start_time, end_time)
VALUES 
  -- Original Classes (Updated to Vietnamese)
  ('Yoga Buổi Sáng', 'Khởi động ngày mới với bài tập Yoga nhẹ nhàng giúp thư giãn tâm trí và tăng cường sự dẻo dai.', 15, 'morning_yoga', NOW() + INTERVAL '1 day 7 hours', NOW() + INTERVAL '1 day 8 hours'),
  ('HIIT Cardio', 'Bài tập cường độ cao giúp đốt cháy calo nhanh chóng và cải thiện sức bền tim mạch vượt trội.', 20, 'hiit_cardio', NOW() + INTERVAL '2 days 18 hours', NOW() + INTERVAL '2 days 19 hours'),
  ('Body Pump', 'Tập tạ toàn thân theo nhịp điệu âm nhạc sôi động, giúp định hình vóc dáng và tăng cường cơ bắp.', 20, 'body_pump', NOW() + INTERVAL '3 days 17 hours', NOW() + INTERVAL '3 days 18 hours'),

  -- New Classes (13 Courses)
  ('Pilates Core', 'Tập trung vào sức mạnh cốt lõi, cải thiện tư thế và sự linh hoạt với các bài tập Pilates chuyên sâu.', 20, 'pilates_logo', NOW() + INTERVAL '1 day 9 hours', NOW() + INTERVAL '1 day 10 hours'),
  ('Đốt Mỡ HIIT', 'Luyện tập cường độ cao ngắt quãng (HIIT) giúp tối ưu hóa việc đốt cháy mỡ thừa ngay cả sau khi tập.', 25, 'hiit_logo', NOW() + INTERVAL '2 days 10 hours', NOW() + INTERVAL '2 days 11 hours'),
  ('Vận Động Chức Năng', 'Cải thiện khả năng vận động hàng ngày thông qua các bài tập mô phỏng chuyển động thực tế.', 15, 'functional_training_logo', NOW() + INTERVAL '1 day 14 hours', NOW() + INTERVAL '1 day 15 hours'),
  ('Kickboxing Shock', 'Sự kết hợp bùng nổ giữa võ thuật và fitness giúp rèn luyện phản xạ và giảm stress cực hiệu quả.', 20, 'kickboxing_logo', NOW() + INTERVAL '3 days 14 hours', NOW() + INTERVAL '3 days 15 hours'),
  ('Zumba Party', 'Hòa mình vào âm nhạc Latinh sôi động và đốt cháy năng lượng trong không khí như một bữa tiệc.', 30, 'zumba_logo', NOW() + INTERVAL '2 days 16 hours', NOW() + INTERVAL '2 days 17 hours'),
  ('Yoga Dòng Chảy', 'Chuỗi chuyển động uyển chuyển kết hợp hơi thở giúp khơi thông nguồn năng lượng và cân bằng tâm trí.', 25, 'yoga_flow_logo', NOW() + INTERVAL '4 days 8 hours', NOW() + INTERVAL '4 days 9 hours 15 minutes'),
  ('Body Pump Pro', 'Phiên bản nâng cao của lớp tạ nhóm, tập trung vào việc kiến tạo những đường nét cơ bắp săn chắc.', 20, 'body_pump_logo', NOW() + INTERVAL '1 day 16 hours', NOW() + INTERVAL '1 day 17 hours'),
  ('Cycling Đua Tốc Độ', 'Đạp xe trong nhà với lộ trình thay đổi độ dốc, giúp xây dựng đôi chân khỏe mạnh và tim mạch bền bỉ.', 18, 'spinning_cycling_logo', NOW() + INTERVAL '5 days 18 hours', NOW() + INTERVAL '5 days 19 hours'),
  ('CrossFit Khắc Nghiệt', 'Chinh phục mọi giới hạn với chuỗi bài tập đa dạng, cường độ cực lớn dành cho những chiến binh gym.', 12, 'crossfit_logo', NOW() + INTERVAL '2 days 20 hours', NOW() + INTERVAL '2 days 21 hours 30 minutes'),
  ('Giãn Cơ Trị Liệu', 'Lớp học chuyên sâu về phục hồi, giúp giải tỏa áp lực lên khớp và cơ bắp sau những ngày tập nặng.', 20, 'stretching_mobility_logo', NOW() + INTERVAL '6 days 17 hours', NOW() + INTERVAL '6 days 18 hours'),
  ('Võ Đạo Karate', 'Rèn luyện tinh thần kỷ luật và kỹ năng tự vệ cơ bản thông qua các kỹ thuật Karate truyền thống.', 15, 'karate_logo', NOW() + INTERVAL '3 days 19 hours', NOW() + INTERVAL '3 days 20 hours'),
  ('Muay Thai Chiến Đấu', 'Trải nghiệm bộ môn võ thuật mạnh mẽ từ Thái Lan, rèn luyện sự bền bỉ và khả năng thực chiến.', 15, 'muay_thai_logo', NOW() + INTERVAL '4 days 14 hours', NOW() + INTERVAL '4 days 15 hours'),
  ('Sức Mạnh Powerlifting', 'Master bộ ba bài tập Squat, Bench Press và Deadlift để đạt được mức tạ kỷ lục mới.', 8, 'powerlifting_logo', NOW() + INTERVAL '1 day 19 hours', NOW() + INTERVAL '1 day 21 hours'),

  -- Round 3 (9 New Classes)
  ('Boxing Thể Hình', 'Lớp học boxing tập trung vào đốt cháy năng lượng và rèn luyện kỹ thuật đấm cơ bản.', 20, 'boxing_fitness_logo', NOW() + INTERVAL '1 day 11 hours', NOW() + INTERVAL '1 day 12 hours'),
  ('Pilates Máy', 'Sử dụng máy Reformer để tăng cường độ và hiệu quả cho các bài tập Pilates truyền thống.', 12, 'reformer_pilates_logo', NOW() + INTERVAL '2 days 12 hours', NOW() + INTERVAL '2 days 13 hours'),
  ('Yoga Nóng', 'Tập luyện trong môi trường nhiệt độ cao giúp thải độc cơ thể và tăng tối đa độ dẻo dai.', 20, 'hot_yoga_logo', NOW() + INTERVAL '3 days 9 hours', NOW() + INTERVAL '3 days 10 hours 15 minutes'),
  ('Huấn Luyện Trường Thọ', 'Chương trình tập luyện khoa học tập trung vào sự bền bỉ của hệ tim mạch và xương khớp.', 15, 'longevity_training_logo', NOW() + INTERVAL '4 days 16 hours', NOW() + INTERVAL '4 days 17 hours'),
  ('Pickleball Nâng Cao', 'Nâng tầm kỹ thuật Pickleball với các bài tập chiến thuật và thi đấu cường độ cao.', 12, 'pickleball_advanced_logo', NOW() + INTERVAL '5 days 9 hours', NOW() + INTERVAL '5 days 10 hours 30 minutes'),
  ('Barre Cơ Bản', 'Sự kết hợp giữa múa Ballet, Pilates và Yoga giúp cơ bắp thon gọn và săn chắc.', 18, 'barre_basics_logo', NOW() + INTERVAL '2 days 7 hours', NOW() + INTERVAL '2 days 8 hours'),
  ('Đạp Xe Thỏa Đam VR', 'Kết hợp công nghệ VR để đưa bạn vào những cung đường đua ảo đầy thử thách và hứng khởi.', 15, 'vr_cycling_logo', NOW() + INTERVAL '1 day 13 hours', NOW() + INTERVAL '1 day 14 hours'),
  ('Trị Liệu Âm Thanh', 'Thả lỏng hoàn toàn cơ thể với âm thanh từ chuông xoay, giúp phục hồi hệ thần kinh sâu sắc.', 25, 'sound_bath_logo', NOW() + INTERVAL '6 days 19 hours', NOW() + INTERVAL '6 days 20 hours'),
  ('Tập Luyện Hyrox', 'Lớp học mô phỏng các phần thi của Hyrox, chuẩn bị cho bạn sức mạnh và sức bền toàn diện.', 20, 'default', NOW() + INTERVAL '3 days 11 hours', NOW() + INTERVAL '3 days 12 hours 30 minutes');
