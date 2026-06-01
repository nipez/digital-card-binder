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
  (2, '2-luis-medina', 'Luis Medina', 'Cleveland Indians', 'cleveland-indians', 'OF', true, false),
  (3, '3-tony-chance', 'Tony Chance', 'Pittsburgh Pirates', 'pittsburgh-pirates', 'OF', true, false),
  (4, '4-david-otto', 'David Otto', 'Oakland Athletics', 'oakland-athletics', 'P', true, false),
  (5, '5-sandy-alomar-jr', 'Sandy Alomar Jr.', 'San Diego Padres', 'san-diego-padres', 'C', true, false),
  (6, '6-rolando-roomes', 'Rolando Roomes', 'Cincinnati Reds', 'cincinnati-reds', 'OF', true, false),
  (7, '7-david-west', 'David West', 'New York Mets', 'new-york-mets', 'P', true, false),
  (8, '8-cris-carpenter', 'Cris Carpenter', 'St. Louis Cardinals', 'st-louis-cardinals', 'P', true, false),
  (9, '9-gregg-jefferies', 'Gregg Jefferies', 'New York Mets', 'new-york-mets', 'IF', true, false),
  (10, '10-doug-dascenzo', 'Doug Dascenzo', 'Chicago Cubs', 'chicago-cubs', 'OF', true, false),
  (11, '11-ron-jones', 'Ron Jones', 'Philadelphia Phillies', 'philadelphia-phillies', 'OF', true, false),
  (12, '12-luis-de-los-santos', 'Luis de los Santos', 'Kansas City Royals', 'kansas-city-royals', 'IF', true, false),
  (13, '13-gary-sheffield', 'Gary Sheffield', 'Milwaukee Brewers', 'milwaukee-brewers', 'SS', true, false),
  (14, '14-mike-harkey', 'Mike Harkey', 'Chicago Cubs', 'chicago-cubs', 'P', true, false),
  (15, '15-lance-blankenship', 'Lance Blankenship', 'Oakland Athletics', 'oakland-athletics', 'IF', true, false),
  (16, '16-william-brennan', 'William Brennan', 'Los Angeles Dodgers', 'los-angeles-dodgers', 'P', true, false),
  (17, '17-john-smoltz', 'John Smoltz', 'Atlanta Braves', 'atlanta-braves', 'P', true, true),
  (18, '18-ramon-martinez', 'Ramon Martinez', 'Los Angeles Dodgers', 'los-angeles-dodgers', 'P', true, false),
  (19, '19-mark-lemke', 'Mark Lemke', 'Atlanta Braves', 'atlanta-braves', '2B', true, false),
  (20, '20-juan-bell', 'Juan Bell', 'Baltimore Orioles', 'baltimore-orioles', 'SS', true, false),
  (21, '21-rey-palacios', 'Rey Palacios', 'Kansas City Royals', 'kansas-city-royals', 'C', true, false),
  (22, '22-felix-jose', 'Felix Jose', 'Oakland Athletics', 'oakland-athletics', 'OF', true, false),
  (23, '23-van-snider', 'Van Snider', 'Cincinnati Reds', 'cincinnati-reds', 'OF', true, false),
  (24, '24-dante-bichette', 'Dante Bichette', 'California Angels', 'california-angels', 'OF', true, false),
  (25, '25-randy-johnson', 'Randy Johnson', 'Montreal Expos', 'montreal-expos', 'P', true, true),
  (26, '26-carlos-quintana', 'Carlos Quintana', 'Boston Red Sox', 'boston-red-sox', '1B', true, false),
  (27, '27-star-rookies-checklist', 'Star Rookies Checklist', 'Checklist', 'checklist', 'CL', false, false),
  (214, '214-darrin-jackson', 'Darrin Jackson', 'Chicago Cubs', 'chicago-cubs', 'OF', false, false),
  (273, '273-craig-biggio', 'Craig Biggio', 'Houston Astros', 'houston-astros', 'C', true, true),
  (471, '471-roberto-alomar', 'Roberto Alomar', 'San Diego Padres', 'san-diego-padres', '2B', true, true)
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
    when player_name = 'Darrin Jackson' and side = 'front' then '/scans/1989-upper-deck-baseball/2-darrin-jackson-front.webp'
    when player_name = 'Darrin Jackson' and side = 'back' then '/scans/1989-upper-deck-baseball/2-darrin-jackson-back.webp'
    when player_name = 'Roberto Alomar' and side = 'front' then '/scans/1989-upper-deck-baseball/3-roberto-alomar-front.webp'
    when player_name = 'Roberto Alomar' and side = 'back' then '/scans/1989-upper-deck-baseball/3-roberto-alomar-back.webp'
    when side = 'front' and card_number % 4 = 0 then '/placeholders/front-needed.svg'
    when side = 'back' and card_number % 5 = 0 then '/placeholders/back-needed.svg'
    when side = 'front' then '/placeholders/demo-front.svg'
    else '/placeholders/demo-back.svg'
  end,
  case
    when card_number = 1 or player_name in ('Darrin Jackson', 'Roberto Alomar') then 'approved'::public.card_image_status
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
