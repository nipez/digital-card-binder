insert into public.sets (slug, name, year, manufacturer, total_cards, description)
values (
  '1989-upper-deck-baseball',
  '1989 Upper Deck Baseball',
  1989,
  'Upper Deck',
  800,
  'A premium late-eighties baseball landmark with crisp photography, hologram flair, and a rookie card that changed the hobby.'
)
on conflict (slug) do update set
  name = excluded.name,
  total_cards = excluded.total_cards,
  description = excluded.description;

with set_row as (
  select id from public.sets where slug = '1989-upper-deck-baseball'
), card_rows(card_number, slug, player_name, team, team_slug, position, is_rookie, is_hall_of_famer) as (
  values
  (1, '1-ken-griffey-jr', 'Ken Griffey Jr.', 'Seattle Mariners', 'seattle-mariners', 'OF', true, true),
  (2, '2-darrin-jackson', 'Darrin Jackson', 'Chicago Cubs', 'chicago-cubs', 'OF', false, false),
  (3, '3-roberto-alomar', 'Roberto Alomar', 'San Diego Padres', 'san-diego-padres', '2B', true, true),
  (4, '4-gregg-jefferies', 'Gregg Jefferies', 'New York Mets', 'new-york-mets', 'IF', true, false),
  (5, '5-sandy-alomar-jr', 'Sandy Alomar Jr.', 'San Diego Padres', 'san-diego-padres', 'C', true, false),
  (6, '6-gary-sheffield', 'Gary Sheffield', 'Milwaukee Brewers', 'milwaukee-brewers', 'SS', true, false),
  (7, '7-jim-abbott', 'Jim Abbott', 'California Angels', 'california-angels', 'P', true, false),
  (8, '8-randy-johnson', 'Randy Johnson', 'Montreal Expos', 'montreal-expos', 'P', true, true),
  (9, '9-craig-biggio', 'Craig Biggio', 'Houston Astros', 'houston-astros', 'C', true, true),
  (10, '10-john-smoltz', 'John Smoltz', 'Atlanta Braves', 'atlanta-braves', 'P', true, true),
  (11, '11-tom-glavine', 'Tom Glavine', 'Atlanta Braves', 'atlanta-braves', 'P', false, true),
  (12, '12-nolan-ryan', 'Nolan Ryan', 'Texas Rangers', 'texas-rangers', 'P', false, true),
  (13, '13-cal-ripken-jr', 'Cal Ripken Jr.', 'Baltimore Orioles', 'baltimore-orioles', 'SS', false, true),
  (14, '14-tony-gwynn', 'Tony Gwynn', 'San Diego Padres', 'san-diego-padres', 'OF', false, true),
  (15, '15-ozzie-smith', 'Ozzie Smith', 'St. Louis Cardinals', 'st-louis-cardinals', 'SS', false, true),
  (16, '16-rickey-henderson', 'Rickey Henderson', 'New York Yankees', 'new-york-yankees', 'OF', false, true),
  (17, '17-wade-boggs', 'Wade Boggs', 'Boston Red Sox', 'boston-red-sox', '3B', false, true),
  (18, '18-kirby-puckett', 'Kirby Puckett', 'Minnesota Twins', 'minnesota-twins', 'OF', false, true),
  (19, '19-mark-mcgwire', 'Mark McGwire', 'Oakland Athletics', 'oakland-athletics', '1B', false, false),
  (20, '20-don-mattingly', 'Don Mattingly', 'New York Yankees', 'new-york-yankees', '1B', false, false),
  (21, '21-will-clark', 'Will Clark', 'San Francisco Giants', 'san-francisco-giants', '1B', false, false),
  (22, '22-bo-jackson', 'Bo Jackson', 'Kansas City Royals', 'kansas-city-royals', 'OF', false, false),
  (23, '23-barry-larkin', 'Barry Larkin', 'Cincinnati Reds', 'cincinnati-reds', 'SS', false, true),
  (24, '24-robin-yount', 'Robin Yount', 'Milwaukee Brewers', 'milwaukee-brewers', 'OF', false, true),
  (25, '25-paul-molitor', 'Paul Molitor', 'Milwaukee Brewers', 'milwaukee-brewers', '3B', false, true),
  (26, '26-andre-dawson', 'Andre Dawson', 'Chicago Cubs', 'chicago-cubs', 'OF', false, true),
  (27, '27-eddie-murray', 'Eddie Murray', 'Los Angeles Dodgers', 'los-angeles-dodgers', '1B', false, true),
  (28, '28-george-brett', 'George Brett', 'Kansas City Royals', 'kansas-city-royals', '3B', false, true),
  (29, '29-roger-clemens', 'Roger Clemens', 'Boston Red Sox', 'boston-red-sox', 'P', false, false),
  (30, '30-jose-canseco', 'Jose Canseco', 'Oakland Athletics', 'oakland-athletics', 'OF', false, false)
)
insert into public.cards (set_id, card_number, slug, player_name, team, team_slug, position, is_rookie, is_hall_of_famer, notes)
select set_row.id, card_rows.card_number, card_rows.slug, card_rows.player_name, card_rows.team, card_rows.team_slug, card_rows.position, card_rows.is_rookie, card_rows.is_hall_of_famer, 'Demo checklist data for MVP browsing and filtering.'
from set_row, card_rows
on conflict (set_id, card_number) do update set
  slug = excluded.slug,
  player_name = excluded.player_name,
  team = excluded.team,
  team_slug = excluded.team_slug,
  position = excluded.position,
  is_rookie = excluded.is_rookie,
  is_hall_of_famer = excluded.is_hall_of_famer;

insert into public.card_images (card_id, side, image_url, status)
select id, side::public.card_image_side,
  case
    when card_number = 1 and side = 'front' then '/scans/1989-upper-deck-baseball/1-ken-griffey-jr-front.webp'
    when card_number = 1 and side = 'back' then '/scans/1989-upper-deck-baseball/1-ken-griffey-jr-back.webp'
    when card_number = 2 and side = 'front' then '/scans/1989-upper-deck-baseball/2-darrin-jackson-front.webp'
    when card_number = 2 and side = 'back' then '/scans/1989-upper-deck-baseball/2-darrin-jackson-back.webp'
    when card_number = 3 and side = 'front' then '/scans/1989-upper-deck-baseball/3-roberto-alomar-front.webp'
    when card_number = 3 and side = 'back' then '/scans/1989-upper-deck-baseball/3-roberto-alomar-back.webp'
    when side = 'front' and card_number % 4 = 0 then '/placeholders/front-needed.svg'
    when side = 'back' and card_number % 5 = 0 then '/placeholders/back-needed.svg'
    when side = 'front' then '/placeholders/demo-front.svg'
    else '/placeholders/demo-back.svg'
  end,
  case
    when card_number in (1, 2, 3) then 'approved'::public.card_image_status
    when side = 'front' and card_number % 4 = 0 then 'missing'::public.card_image_status
    when side = 'back' and card_number % 5 = 0 then 'missing'::public.card_image_status
    else 'approved'::public.card_image_status
  end
from public.cards
cross join (values ('front'), ('back')) as sides(side)
where set_id = (select id from public.sets where slug = '1989-upper-deck-baseball')
on conflict (card_id, side) do update set
  image_url = excluded.image_url,
  status = excluded.status;
