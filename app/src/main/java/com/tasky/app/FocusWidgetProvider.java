package com.tasky.app;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import android.os.Build;
import android.widget.RemoteViews;

public class FocusWidgetProvider extends AppWidgetProvider {

    @Override
    public void onUpdate(Context context, AppWidgetManager appWidgetManager, int[] appWidgetIds) {
        for (int appWidgetId : appWidgetIds) {
            updateAppWidget(context, appWidgetManager, appWidgetId);
        }
    }

    static void updateAppWidget(Context context, AppWidgetManager appWidgetManager, int appWidgetId) {
        RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.focus_widget);

        int flag = PendingIntent.FLAG_UPDATE_CURRENT;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            flag |= PendingIntent.FLAG_IMMUTABLE;
        }

        // Action 1: Calendar deep link
        Intent calendarIntent = new Intent(context, MainActivity.class);
        calendarIntent.setAction(Intent.ACTION_VIEW);
        calendarIntent.setData(Uri.parse("https://localhost?action=view-calendar"));
        calendarIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        PendingIntent calendarPI = PendingIntent.getActivity(context, 10, calendarIntent, flag);
        views.setOnClickPendingIntent(R.id.btn_action_calendar, calendarPI);

        // Action 2: Habits deep link
        Intent habitsIntent = new Intent(context, MainActivity.class);
        habitsIntent.setAction(Intent.ACTION_VIEW);
        habitsIntent.setData(Uri.parse("https://localhost?action=view-habits"));
        habitsIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        PendingIntent habitsPI = PendingIntent.getActivity(context, 20, habitsIntent, flag);
        views.setOnClickPendingIntent(R.id.btn_action_habits, habitsPI);

        // Action 3: Chat deep link
        Intent chatIntent = new Intent(context, MainActivity.class);
        chatIntent.setAction(Intent.ACTION_VIEW);
        chatIntent.setData(Uri.parse("https://localhost?action=view-chat"));
        chatIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        PendingIntent chatPI = PendingIntent.getActivity(context, 30, chatIntent, flag);
        views.setOnClickPendingIntent(R.id.btn_action_chat, chatPI);

        appWidgetManager.updateAppWidget(appWidgetId, views);
    }
}
