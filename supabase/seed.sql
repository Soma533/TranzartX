-- Seed: 3 sample opportunities + demo gallery profile placeholder.
-- Replace org_id with a real profiles.id after first signup, or run via dashboard.
-- Kept ID-agnostic: inserts only if a GALLERY/ORG profile exists.

do $$
declare gid uuid;
begin
  select id into gid from profiles where role in ('GALLERY','ORG') limit 1;
  if gid is null then return; end if;
  insert into opportunities (org_id, type, title, description, location, deadline, disciplines) values
    (gid, 'OPEN_CALL', 'Lagos Emerging Artists Open Call', 'Open call for contemporary painters and mixed-media artists. Submit 5 works + statement.', 'Lagos, Nigeria', now() + interval '21 days', array['Painting','Mixed Media']),
    (gid, 'RESIDENCY', 'Accra Contemporary Residency', '4-week residency for emerging African artists. Studio + stipend.', 'Accra, Ghana', now() + interval '35 days', array['Painting','Sculpture','Photography']),
    (gid, 'GRANT', 'New Voices Art Grant', 'Small grant for first-exhibition projects. Open to all disciplines.', 'Remote', now() + interval '50 days', array['Painting','Digital','Textile'])
  on conflict do nothing;
end $$;
