-- =============================================================================
-- Migration: 00024_real_users_seed.sql
-- Description: Onboard 14 Real Sunfraa Global Team Members
-- Source: SUNFRAA GLOBAL- User list.pdf
-- Default Initial Password: Demo@1234
-- =============================================================================

DO $$
DECLARE
  users_data jsonb := '[
    {
      "id": "c1000001-0000-4000-8000-000000000001",
      "email": "partner@sunfraa.com",
      "name": "Eshan Choliya",
      "phone": "+91 75758 77544",
      "role": "DIRECTOR"
    },
    {
      "id": "c1000002-0000-4000-8000-000000000002",
      "email": "naman.n@sunfraa.com",
      "name": "Naman Nagarsheth",
      "phone": "+91 98191 15871",
      "role": "DIRECTOR"
    },
    {
      "id": "c1000003-0000-4000-8000-000000000003",
      "email": "imran.sunfraa@gmail.com",
      "name": "Imran Khan",
      "phone": "+91 87584 34687",
      "role": "SITE_EXECUTION"
    },
    {
      "id": "c1000004-0000-4000-8000-000000000004",
      "email": "harsh.sunfraa10@gmail.com",
      "name": "Harsh Soni",
      "phone": "+91 98983 93636",
      "role": "SALES"
    },
    {
      "id": "c1000005-0000-4000-8000-000000000005",
      "email": "maulik.sunfraa1628@gmail.com",
      "name": "Maulik Parmar",
      "phone": "+91 83479 75957",
      "role": "LIAISONING"
    },
    {
      "id": "c1000006-0000-4000-8000-000000000006",
      "email": "nilamsunfraa@gmail.com",
      "name": "Nilam Kalal",
      "phone": "+91 63594 24431",
      "role": "LIAISONING"
    },
    {
      "id": "c1000007-0000-4000-8000-000000000007",
      "email": "komal.sunfraa@gmail.com",
      "name": "Komal Prajapati",
      "phone": "+91 84604 32311",
      "role": "ACCOUNTS"
    },
    {
      "id": "c1000008-0000-4000-8000-000000000008",
      "email": "ajay.sunfraa@gmail.com",
      "name": "Ajay Prajapati",
      "phone": "+91 79900 19813",
      "role": "SITE_EXECUTION"
    },
    {
      "id": "c1000009-0000-4000-8000-000000000009",
      "email": "viral97.sunfraa@gmail.com",
      "name": "Viral Joshi",
      "phone": "+91 90334 39566",
      "role": "SITE_EXECUTION"
    },
    {
      "id": "c1000010-0000-4000-8000-000000000010",
      "email": "bhairav.sunfraa@gmail.com",
      "name": "Bhairav Prajapati",
      "phone": "+91 84879 04152",
      "role": "SITE_EXECUTION"
    },
    {
      "id": "c1000011-0000-4000-8000-000000000011",
      "email": "karan.sunfraa@gmail.com",
      "name": "Karan Vaghela",
      "phone": "+91 74054 66094",
      "role": "SITE_EXECUTION"
    },
    {
      "id": "c1000012-0000-4000-8000-000000000012",
      "email": "sunil.sunfraa@gmail.com",
      "name": "Sunil Prajapati",
      "phone": "+91 90996 70435",
      "role": "SITE_EXECUTION"
    },
    {
      "id": "c1000013-0000-4000-8000-000000000013",
      "email": "jknair.sunfraa@gmail.com",
      "name": "J K Nair",
      "phone": "+91 90994 66777",
      "role": "STORE_PURCHASE"
    },
    {
      "id": "c1000014-0000-4000-8000-000000000014",
      "email": "vishurathod75@gmail.com",
      "name": "Vishal Rathod",
      "phone": "+91 92740 41496",
      "role": "STORE_PURCHASE"
    }
  ]'::jsonb;
  u jsonb;
  v_uid uuid;
  v_email text;
  v_name text;
  v_phone text;
  v_role text;
BEGIN
  FOR u IN SELECT * FROM jsonb_array_elements(users_data)
  LOOP
    v_uid := (u->>'id')::uuid;
    v_email := lower(u->>'email');
    v_name := u->>'name';
    v_phone := u->>'phone';
    v_role := u->>'role';

    -- 1. Insert into auth.users if not exists
    IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = v_uid OR lower(email) = v_email) THEN
      INSERT INTO auth.users (
        id,
        instance_id,
        aud,
        role,
        email,
        encrypted_password,
        email_confirmed_at,
        created_at,
        updated_at,
        raw_app_meta_data,
        raw_user_meta_data,
        confirmation_token,
        recovery_token,
        email_change_token_new,
        email_change
      ) VALUES (
        v_uid,
        '00000000-0000-0000-0000-000000000000',
        'authenticated',
        'authenticated',
        v_email,
        crypt('sunfraa@1234', gen_salt('bf')),
        now(),
        now(),
        now(),
        '{"provider":"email","providers":["email"]}',
        jsonb_build_object('name', v_name, 'phone', v_phone),
        '',
        '',
        '',
        ''
      );
    ELSE
      -- Update password to sunfraa@1234 and metadata if already exists
      UPDATE auth.users
      SET encrypted_password = crypt('sunfraa@1234', gen_salt('bf')),
          email_confirmed_at = COALESCE(email_confirmed_at, now()),
          raw_user_meta_data = jsonb_build_object('name', v_name, 'phone', v_phone),
          updated_at = now()
      WHERE id = v_uid OR lower(email) = v_email;
      
      -- Fetch exact uid if matched by email
      SELECT id INTO v_uid FROM auth.users WHERE lower(email) = v_email;
    END IF;

    -- 2. Insert into auth.identities if not exists
    IF NOT EXISTS (SELECT 1 FROM auth.identities WHERE user_id = v_uid AND provider = 'email') THEN
      INSERT INTO auth.identities (
        id,
        user_id,
        provider_id,
        identity_data,
        provider,
        last_sign_in_at,
        created_at,
        updated_at
      ) VALUES (
        gen_random_uuid(),
        v_uid,
        v_uid::text,
        jsonb_build_object('sub', v_uid::text, 'email', v_email),
        'email',
        now(),
        now(),
        now()
      );
    END IF;

    -- 3. Upsert into public.profiles
    INSERT INTO public.profiles (
      id,
      name,
      phone,
      role,
      active,
      created_at,
      updated_at
    ) VALUES (
      v_uid,
      v_name,
      v_phone,
      v_role::user_role,
      true,
      now(),
      now()
    )
    ON CONFLICT (id) DO UPDATE
    SET name = EXCLUDED.name,
        phone = EXCLUDED.phone,
        role = EXCLUDED.role,
        active = true,
        updated_at = now();

  END LOOP;
END $$;
