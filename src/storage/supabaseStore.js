const SUPABASE_TABLES = {
  businesses: "replypilot_businesses",
  faqs: "replypilot_faqs",
  conversations: "replypilot_conversations",
  messages: "replypilot_messages",
  leads: "replypilot_leads"
};

export function supabaseConfigured() {
  return Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

export async function loadWorkspaceFromSupabase() {
  const [businesses, faqs, conversations, messages, leads] = await Promise.all([
    supabaseRequest(SUPABASE_TABLES.businesses, "?select=*&order=name.asc"),
    supabaseRequest(SUPABASE_TABLES.faqs, "?select=*&order=sort_order.asc"),
    supabaseRequest(SUPABASE_TABLES.conversations, "?select=*&order=created_at.desc&limit=100"),
    supabaseRequest(SUPABASE_TABLES.messages, "?select=*&order=created_at.asc&limit=500"),
    supabaseRequest(SUPABASE_TABLES.leads, "?select=*")
  ]);

  return {
    businesses: businesses.map((business) => ({
      id: business.id,
      name: business.name,
      type: business.type,
      whatsappNumber: business.whatsapp_number,
      owner: business.owner_name,
      autoReplyEnabled: business.auto_reply_enabled,
      escalationEnabled: business.escalation_enabled,
      businessHours: business.business_hours,
      appointmentLabel: business.appointment_label,
      faqs: faqs
        .filter((faq) => faq.business_id === business.id)
        .map((faq) => ({
          question: faq.question,
          answer: faq.answer
        }))
    })),
    conversations: conversations.map((conversation) => {
      const lead = leads.find((item) => item.conversation_id === conversation.id);

      return {
        id: conversation.id,
        businessId: conversation.business_id,
        customerName: conversation.customer_name,
        customerPhone: conversation.customer_phone,
        status: conversation.status,
        intent: conversation.intent,
        summary: conversation.summary,
        lead: {
          name: lead?.name || "",
          phone: lead?.phone || conversation.customer_phone || "",
          service: lead?.service || "",
          preferredTime: lead?.preferred_time || ""
        },
        messages: messages
          .filter((message) => message.conversation_id === conversation.id)
          .map((message) => ({
            from: message.sender,
            text: message.body,
            timestamp: message.created_at
          }))
      };
    })
  };
}

export async function saveConversationToSupabase(conversation) {
  await supabaseRequest(SUPABASE_TABLES.conversations, "", {
    method: "POST",
    body: {
      id: conversation.id,
      business_id: conversation.businessId,
      customer_name: conversation.customerName,
      customer_phone: conversation.customerPhone,
      status: conversation.status,
      intent: conversation.intent,
      summary: conversation.summary
    }
  });

  await supabaseRequest(SUPABASE_TABLES.leads, "", {
    method: "POST",
    body: {
      conversation_id: conversation.id,
      business_id: conversation.businessId,
      name: conversation.lead.name || null,
      phone: conversation.lead.phone || null,
      service: conversation.lead.service || null,
      preferred_time: conversation.lead.preferredTime || null
    }
  });

  await supabaseRequest(SUPABASE_TABLES.messages, "", {
    method: "POST",
    body: conversation.messages.map((message) => ({
      conversation_id: conversation.id,
      business_id: conversation.businessId,
      sender: message.from,
      body: message.text,
      created_at: message.timestamp
    }))
  });
}

export async function saveBusinessSettingsToSupabase(business) {
  await supabaseRequest(`${SUPABASE_TABLES.businesses}?id=eq.${encodeURIComponent(business.id)}`, "", {
    method: "PATCH",
    body: {
      name: business.name,
      type: business.type,
      owner_name: business.owner,
      whatsapp_number: business.whatsappNumber,
      appointment_label: business.appointmentLabel,
      auto_reply_enabled: business.autoReplyEnabled,
      escalation_enabled: business.escalationEnabled,
      business_hours: business.businessHours,
      updated_at: new Date().toISOString()
    }
  });

  await supabaseRequest(`${SUPABASE_TABLES.faqs}?business_id=eq.${encodeURIComponent(business.id)}`, "", {
    method: "DELETE"
  });

  if (business.faqs.length) {
    await supabaseRequest(SUPABASE_TABLES.faqs, "", {
      method: "POST",
      body: business.faqs.map((faq, index) => ({
        business_id: business.id,
        question: faq.question,
        answer: faq.answer,
        sort_order: index + 1
      }))
    });
  }
}

async function supabaseRequest(table, query = "", options = {}) {
  const url = `${process.env.SUPABASE_URL}/rest/v1/${table}${query}`;
  const response = await fetch(url, {
    method: options.method || "GET",
    headers: {
      apikey: process.env.SUPABASE_SERVICE_ROLE_KEY,
      authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
      "content-type": "application/json",
      prefer: "return=representation"
    },
    body: options.body ? JSON.stringify(options.body) : undefined
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Supabase ${table} request failed: ${detail}`);
  }

  if (response.status === 204) {
    return [];
  }

  return response.json();
}
