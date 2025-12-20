import { supabase } from './supabase'
import type { Trade } from '../components/TradeGamingApp'

/**
 * Supabaseからトレードを取得
 */
export async function fetchTrades(userId: string): Promise<Trade[]> {
  try {
    const { data, error } = await supabase
      .from('trades')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: false })
      .order('time', { ascending: false })

    if (error) throw error

    // Supabaseのデータ形式をアプリのTrade型に変換
    return (data || []).map((row) => ({
      id: row.id,
      symbol: row.symbol,
      side: row.side,
      entryPrice: row.entry_price ?? undefined,
      exitPrice: row.exit_price ?? undefined,
      quantity: row.quantity ?? undefined,
      pnl: row.pnl,
      date: row.date,
      time: row.time,
      logic: row.logic,
      timeframe: row.timeframe,
      strategy: row.strategy,
      mood: row.mood,
      imageUrl: row.image_url ?? undefined,
      status: row.status,
    }))
  } catch (error) {
    console.error('トレード取得エラー:', error)
    throw error
  }
}

/**
 * 新しいトレードをSupabaseに保存
 */
export async function createTrade(userId: string, trade: Omit<Trade, 'id'>): Promise<Trade> {
  try {
    const { data, error } = await supabase
      .from('trades')
      .insert({
        user_id: userId,
        symbol: trade.symbol,
        side: trade.side,
        entry_price: trade.entryPrice ?? null,
        exit_price: trade.exitPrice ?? null,
        quantity: trade.quantity ?? null,
        pnl: trade.pnl,
        date: trade.date,
        time: trade.time,
        logic: trade.logic,
        timeframe: trade.timeframe,
        strategy: trade.strategy,
        mood: trade.mood,
        image_url: trade.imageUrl ?? null,
        status: trade.status,
      })
      .select()
      .single()

    if (error) throw error

    return {
      id: data.id,
      symbol: data.symbol,
      side: data.side,
      entryPrice: data.entry_price ?? undefined,
      exitPrice: data.exit_price ?? undefined,
      quantity: data.quantity ?? undefined,
      pnl: data.pnl,
      date: data.date,
      time: data.time,
      logic: data.logic,
      timeframe: data.timeframe,
      strategy: data.strategy,
      mood: data.mood,
      imageUrl: data.image_url ?? undefined,
      status: data.status,
    }
  } catch (error) {
    console.error('トレード保存エラー:', error)
    throw error
  }
}

/**
 * トレードを更新
 */
export async function updateTrade(userId: string, tradeId: string, updates: Partial<Trade>): Promise<Trade> {
  try {
    const updateData: any = {}
    
    if (updates.symbol !== undefined) updateData.symbol = updates.symbol
    if (updates.side !== undefined) updateData.side = updates.side
    if (updates.entryPrice !== undefined) updateData.entry_price = updates.entryPrice
    if (updates.exitPrice !== undefined) updateData.exit_price = updates.exitPrice
    if (updates.quantity !== undefined) updateData.quantity = updates.quantity
    if (updates.pnl !== undefined) updateData.pnl = updates.pnl
    if (updates.date !== undefined) updateData.date = updates.date
    if (updates.time !== undefined) updateData.time = updates.time
    if (updates.logic !== undefined) updateData.logic = updates.logic
    if (updates.timeframe !== undefined) updateData.timeframe = updates.timeframe
    if (updates.strategy !== undefined) updateData.strategy = updates.strategy
    if (updates.mood !== undefined) updateData.mood = updates.mood
    if (updates.imageUrl !== undefined) updateData.image_url = updates.imageUrl
    if (updates.status !== undefined) updateData.status = updates.status

    updateData.updated_at = new Date().toISOString()

    const { data, error } = await supabase
      .from('trades')
      .update(updateData)
      .eq('id', tradeId)
      .eq('user_id', userId)
      .select()
      .single()

    if (error) throw error

    return {
      id: data.id,
      symbol: data.symbol,
      side: data.side,
      entryPrice: data.entry_price ?? undefined,
      exitPrice: data.exit_price ?? undefined,
      quantity: data.quantity ?? undefined,
      pnl: data.pnl,
      date: data.date,
      time: data.time,
      logic: data.logic,
      timeframe: data.timeframe,
      strategy: data.strategy,
      mood: data.mood,
      imageUrl: data.image_url ?? undefined,
      status: data.status,
    }
  } catch (error) {
    console.error('トレード更新エラー:', error)
    throw error
  }
}

/**
 * トレードを削除
 */
export async function deleteTrade(userId: string, tradeId: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('trades')
      .delete()
      .eq('id', tradeId)
      .eq('user_id', userId)

    if (error) throw error
  } catch (error) {
    console.error('トレード削除エラー:', error)
    throw error
  }
}

